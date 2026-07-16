import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ses from "aws-cdk-lib/aws-ses";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as path from "path";

export interface BackendStackProps extends cdk.StackProps {
  notifyEmail: string;
}

const EVENT_SOURCE_PREFIX = "levecare";

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // ---------- Data (ADR-004: one on-demand table per service) ----------
    const patientsTable = this.table("PatientsTable", "levecare-patients");
    const intakeTable = this.table("IntakeTable", "levecare-intake");
    const bookingsTable = this.table("BookingsTable", "levecare-bookings");

    // ---------- Auth ----------
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "levecare-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: { minLength: 10 },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
    });

    // ---------- Events (ADR-005) ----------
    const bus = new events.EventBus(this, "Bus", { eventBusName: "levecare-bus" });

    const notifyDlq = new sqs.Queue(this, "NotifyDlq", { queueName: "levecare-notify-dlq" });
    const notifyQueue = new sqs.Queue(this, "NotifyQueue", {
      queueName: "levecare-notify",
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: { queue: notifyDlq, maxReceiveCount: 3 },
    });

    new events.Rule(this, "NotifyRule", {
      eventBus: bus,
      eventPattern: { source: [{ prefix: EVENT_SOURCE_PREFIX }] as any },
      targets: [new targets.SqsQueue(notifyQueue)],
    });

    // SES sandbox: sender and recipient identity must be verified.
    new ses.EmailIdentity(this, "NotifyEmailIdentity", {
      identity: ses.Identity.email(props.notifyEmail),
    });

    // ---------- Go lambdas (ADR-002) ----------
    const goEnv = { EVENT_BUS_NAME: bus.eventBusName };
    const intakeFn = this.goFunction("IntakeFn", "levecare-intake", "intake", {
      ...goEnv,
      TABLE_NAME: intakeTable.tableName,
    });
    const schedulingFn = this.goFunction("SchedulingFn", "levecare-scheduling", "scheduling", {
      ...goEnv,
      TABLE_NAME: bookingsTable.tableName,
    });
    const notificationFn = this.goFunction("NotificationFn", "levecare-notification", "notification", {
      NOTIFY_EMAIL: props.notifyEmail,
    });

    intakeTable.grantReadWriteData(intakeFn);
    bookingsTable.grantReadWriteData(schedulingFn);
    bus.grantPutEventsTo(intakeFn);
    bus.grantPutEventsTo(schedulingFn);

    notificationFn.addEventSource(new SqsEventSource(notifyQueue, { batchSize: 5 }));
    notificationFn.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
      }),
    );

    // ---------- Java clinical core (ADR-002, ADR-003) ----------
    const patientsFn = new lambda.Function(this, "PatientsFn", {
      functionName: "levecare-patients",
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.X86_64,
      handler:
        "com.amazonaws.serverless.proxy.spring.SpringDelegatingLambdaContainerHandler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../services/patients/target/patients-service.jar"),
      ),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(29),
      snapStart: lambda.SnapStartConf.ON_PUBLISHED_VERSIONS,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: this.logGroup("PatientsLogs", "levecare-patients"),
      environment: {
        MAIN_CLASS: "care.leve.patients.PatientsApplication",
        TABLE_NAME: patientsTable.tableName,
        EVENT_BUS_NAME: bus.eventBusName,
      },
    });
    patientsTable.grantReadWriteData(patientsFn);
    bus.grantPutEventsTo(patientsFn);

    // SnapStart requires invoking a published version, not $LATEST.
    const patientsAlias = new lambda.Alias(this, "PatientsAlias", {
      aliasName: "live",
      version: patientsFn.currentVersion,
    });

    // ---------- API ----------
    const authorizer = new HttpJwtAuthorizer(
      "JwtAuth",
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      { jwtAudience: [userPoolClient.userPoolClientId] },
    );

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "levecare-api",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const patientsIntegration = new HttpLambdaIntegration("PatientsInt", patientsAlias);
    const intakeIntegration = new HttpLambdaIntegration("IntakeInt", intakeFn);
    const schedulingIntegration = new HttpLambdaIntegration("SchedulingInt", schedulingFn);

    // Public: eligibility intake is the top of the funnel (no account yet).
    api.addRoutes({
      path: "/intake",
      methods: [apigwv2.HttpMethod.POST],
      integration: intakeIntegration,
    });
    api.addRoutes({
      path: "/intake/{id}",
      methods: [apigwv2.HttpMethod.GET],
      integration: intakeIntegration,
    });
    api.addRoutes({
      path: "/slots",
      methods: [apigwv2.HttpMethod.GET],
      integration: schedulingIntegration,
    });

    // JWT-protected clinical and booking routes.
    api.addRoutes({
      path: "/patients/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: patientsIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/patients",
      methods: [apigwv2.HttpMethod.ANY],
      integration: patientsIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/bookings",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: schedulingIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/bookings/{id}",
      methods: [apigwv2.HttpMethod.GET],
      integration: schedulingIntegration,
      authorizer,
    });
    api.addRoutes({
      path: "/bookings/{id}/cancel",
      methods: [apigwv2.HttpMethod.POST],
      integration: schedulingIntegration,
      authorizer,
    });

    this.apiUrl = api.apiEndpoint;

    // ---------- Observability ----------
    const dashboard = new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: "levecare",
    });
    const fns: [string, lambda.IFunction][] = [
      ["patients", patientsFn],
      ["intake", intakeFn],
      ["scheduling", schedulingFn],
      ["notification", notificationFn],
    ];
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Invocations",
        left: fns.map(([n, f]) => f.metricInvocations({ label: n })),
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: "p95 duration (ms)",
        left: fns.map(([n, f]) => f.metricDuration({ statistic: "p95", label: n })),
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: "Errors / DLQ depth",
        left: fns.map(([n, f]) => f.metricErrors({ label: n })),
        right: [notifyDlq.metricApproximateNumberOfMessagesVisible({ label: "dlq" })],
        width: 8,
      }),
    );

    // ---------- Cost guardrail ----------
    new budgets.CfnBudget(this, "MonthlyBudget", {
      budget: {
        budgetName: "levecare-monthly",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: 5, unit: "USD" },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 80,
          },
          subscribers: [{ subscriptionType: "EMAIL", address: props.notifyEmail }],
        },
      ],
    });

    // ---------- Outputs ----------
    new cdk.CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
  }

  private table(id: string, name: string): dynamodb.Table {
    return new dynamodb.Table(this, id, {
      tableName: name,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },
    });
  }

  private goFunction(
    id: string,
    name: string,
    dir: string,
    environment: Record<string, string>,
  ): lambda.Function {
    return new lambda.Function(this, id, {
      functionName: name,
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      code: lambda.Code.fromAsset(path.join(__dirname, `../../dist/${dir}`)),
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      tracing: lambda.Tracing.ACTIVE,
      logGroup: this.logGroup(`${id}Logs`, name),
      environment,
    });
  }

  private logGroup(id: string, fnName: string): logs.LogGroup {
    return new logs.LogGroup(this, id, {
      logGroupName: `/aws/lambda/${fnName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
