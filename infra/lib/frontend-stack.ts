import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import * as fs from "fs";

export interface FrontendStackProps extends cdk.StackProps {
  apiUrl: string;
}

/**
 * S3 REST origins do not resolve directory indexes. Next.js `trailingSlash`
 * exports pages as `/pt/index.html`, so a viewer request for `/pt/` would 403
 * and previously fell through the SPA error document to the root redirect stub.
 * Rewrite directory URIs to `…/index.html` at the edge before S3.
 */
const INDEX_REWRITE_SOURCE = `
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }

  return request;
}
`;

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const rewriteFn = new cloudfront.Function(this, "IndexRewriteFn", {
      code: cloudfront.FunctionCode.fromInline(INDEX_REWRITE_SOURCE),
      comment: "Map /path/ to /path/index.html for Next static export",
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: rewriteFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      defaultRootObject: "index.html",
      // Genuine misses stay 404 — do not remap to root index.html (that hid /pt/).
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Only deploy assets when the frontend has been built (keeps `cdk synth`
    // usable for backend-only iterations).
    const webOut = path.join(__dirname, "../../web/out");
    if (fs.existsSync(webOut)) {
      new s3deploy.BucketDeployment(this, "DeploySite", {
        sources: [s3deploy.Source.asset(webOut)],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ["/*"],
      });
    }

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "ApiUrl", { value: props.apiUrl });
  }
}
