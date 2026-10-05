import {
  bucket,
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

const origin = "https://touch-grass.abhishekmurthy.com";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = {
    privateNetworkEndpoint: "postgres",
    tcpProxies: { "5432": {} },
  };
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "us-east4-eqdc4a",
    sizeMB: 5000,
  });
  const touchGrass = bucket("touch-grass", { region: "iad" });
  const api = service("api", {
    source: github("rootsec1/touch-grass", { checkSuites: true }),
    build: {
      buildEnvironment: "V3",
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: [
        "/apps/server/**",
        "/packages/**",
        "/bun.lock",
        "/package.json",
        "/Dockerfile",
        "/.dockerignore",
        "/.railway/**",
      ],
    },
    healthcheck: "/healthz",
    healthcheckTimeout: 120,
    preDeploy: "bun run --cwd packages/db db:migrate",
    replicas: { "us-east4-eqdc4a": 1 },
    deploy: { restartPolicyMaxRetries: 3 },
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_URL: origin,
      CORS_ORIGIN: origin,
      DATABASE_URL: Postgres.env.DATABASE_URL,
      GEMINI_API_KEY: preserve(),
      NODE_ENV: "production",
      PORT: "3000",
      S3_URL:
        "https://${{touch-grass.ACCESS_KEY_ID}}:${{touch-grass.SECRET_ACCESS_KEY}}@t3.storageapi.dev/${{touch-grass.BUCKET}}?region=auto&style=virtual",
      VAPID_KEYS: preserve(),
    },
  });

  return project("touch-grass", {
    resources: [api, Postgres, postgresVolume, touchGrass],
  });
});
