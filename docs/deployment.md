# Deployment setup

One-time steps to enable CI/CD from GitHub Actions to AWS via OIDC (no long-lived keys).

## 1. CDK bootstrap

```bash
cd infra && npx cdk bootstrap
```

## 2. Create the GitHub OIDC deploy role

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Identity provider (skip if the account already has one for GitHub)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

cat > /tmp/trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:igorjm/levecare:*" }
    }
  }]
}
EOF

aws iam create-role \
  --role-name levecare-github-deploy \
  --assume-role-policy-document file:///tmp/trust.json

# CDK deployments assume the CDK bootstrap roles, so the deploy role only
# needs permission to assume them:
cat > /tmp/policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::${ACCOUNT_ID}:role/cdk-*"
  }]
}
EOF

aws iam put-role-policy \
  --role-name levecare-github-deploy \
  --policy-name cdk-deploy \
  --policy-document file:///tmp/policy.json

echo "Role ARN: arn:aws:iam::${ACCOUNT_ID}:role/levecare-github-deploy"
```

## 3. GitHub repository configuration

- Secret `AWS_DEPLOY_ROLE_ARN` — the role ARN printed above.
- Environment `dev` with variables (filled after the first deploy from the stack outputs):
  - `API_URL`
  - `USER_POOL_ID`
  - `USER_POOL_CLIENT_ID`

The first deploy can run without the three variables (the frontend falls back to placeholder values); set them from the `LevecareBackend` stack outputs and re-run the workflow so the frontend is built against the real API.

## 4. SES

The stack creates an email identity for the notification address. Click the verification link SES sends before notifications will deliver (sandbox mode).
