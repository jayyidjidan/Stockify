# Stockify Kubernetes

Kubernetes manifests for Stockify Staging and Production environments.

## Structure

- `staging/` - Staging namespace and workloads.
- `production/` - Production namespace and workloads.

Both environments are managed with Kustomize.

## Environments

| Environment | Namespace | Frontend NodePort | Database |
|---|---|---:|---|
| Staging | stockify-staging | 30080 | PostgreSQL Deployment |
| Production | stockify-production | 30081 | PostgreSQL StatefulSet |

## Render Manifests

```bash
kubectl kustomize k8s/staging
kubectl kustomize k8s/production

## Secrets

Secret values must never be committed to Git.

Staging references:
- `stockify-staging-db-secret`
- `stockify-staging-backend-secret`

Production references:
- `stockify-production-db-secret`
- `stockify-production-backend-secret`

Create and manage Secret resources separately from these manifests.

## Database

- Staging uses a PostgreSQL Deployment with a PersistentVolumeClaim.
- Production uses a PostgreSQL StatefulSet with a PersistentVolumeClaim.
- Database PVCs must be retained during application updates.
- Do not delete database PVCs as part of routine deployment or rollback.

## Database Migration and Seeding

Migration and seed Jobs are intentionally excluded from the base Kustomize resources.

Run them as separate one-off deployment operations using the matching backend image version and the appropriate environment Secret references.

Do not reuse old local Docker images for Kubernetes Jobs.

## Image Versions

Application images are pinned to the currently deployed Git SHA.

Update image tags deliberately when deploying a new application version.

## Rollback

Review the previous image version and deployment configuration before rolling back.

For application workloads, use the appropriate previous image tag and verify application health after rollback.

Database restoration must use a verified backup. Do not delete or recreate database PVCs during application rollback.
