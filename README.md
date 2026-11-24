# Stockify — End-to-End DevOps Implementation

Stockify is a web-based inventory management application supported by an end-to-end DevOps implementation. This project demonstrates containerization, Kubernetes orchestration, automated CI/CD, autoscaling, and centralized observability.

## 1. Project Overview

Stockify provides a centralized platform for inventory operations.

### Core Features
- Product Management
- Stock Movement
- Inventory Analytics
- Role Management (Admin, Warehouse Staff, Manager)

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Containerization | Docker |
| Container Registry | GitHub Container Registry |
| Orchestration | K3s Kubernetes |
| Reverse Proxy | Nginx |

## 2. System Architecture

Stockify runs on an Ubuntu 24.04 VPS using a single-node K3s cluster. Staging and Production are separated using Kubernetes namespaces.

```mermaid
flowchart TD
    U[Users] --> N[Nginx Reverse Proxy]
    N --> S[Staging Domain]
    N --> P[Production Domain]

    subgraph K3s[K3s Kubernetes Cluster]
        subgraph ST[stockify-staging]
            SF[Frontend]
            SB[Backend]
            SP[(PostgreSQL)]
            SF --> SB --> SP
        end

        subgraph PR[stockify-production]
            PF[Frontend]
            PB[Backend]
            PP[(PostgreSQL StatefulSet + PVC)]
            PF --> PB --> PP
            H[HPA: Frontend and Backend]
        end
    end

    S --> SF
    P --> PF

    subgraph OBS[Observability Stack]
        PM[Prometheus]
        GA[Grafana Alloy]
        L[Loki]
        T[Tempo]
        G[Grafana]
    end

    K3s --> PM
    K3s --> GA
    GA --> L
    GA --> T
    PM --> G
    L --> G
    T --> G
