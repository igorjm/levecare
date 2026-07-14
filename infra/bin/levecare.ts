#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// ADR-006: production posture is sa-east-1; the demo deploys to us-east-1.
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: app.node.tryGetContext("region") ?? "us-east-1",
};

const backend = new BackendStack(app, "LevecareBackend", {
  env,
  notifyEmail: app.node.tryGetContext("notifyEmail"),
});

new FrontendStack(app, "LevecareFrontend", {
  env,
  apiUrl: backend.apiUrl,
});

app.synth();
