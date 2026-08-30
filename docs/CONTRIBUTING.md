# Contributing Guidelines

## Goals

These guidelines help keep GigCircle easy to review, easy to test, and easy for new contributors to understand.

## Before You Start

- read the docs in this folder
- confirm the feature or bug is within current project scope
- check whether related work already exists in the repository

## Branching

- create a separate branch for each feature, fix, or documentation update
- prefer short, descriptive branch names such as `feature/worker-filters` or `fix/login-validation`
- avoid mixing unrelated changes in one branch

## Coding Guidelines

- keep changes focused and minimal
- follow the existing structure and naming conventions
- reuse existing DTOs, services, and UI patterns where practical
- avoid hardcoding secrets, URLs, or credentials
- update documentation when behavior or setup changes

## Backend Expectations

- keep controllers thin and move business logic into services
- use DTOs for API contracts instead of exposing entities directly
- respect role boundaries for customer, worker, and admin endpoints
- keep persistence changes aligned with the existing entity and repository structure

## Frontend Expectations

- keep API calls inside `src/services/api/`
- keep route logic in pages and reusable UI in components
- preserve type safety using the shared types under `src/types/`
- prefer clear loading, error, and empty states for user-facing flows

## Pull Request Checklist

- the change has a clear purpose
- related docs are updated if needed
- no secrets or local environment files are committed
- impacted commands or tests were run where possible
- the PR description explains what changed and how it was verified

## Commit Message Guidance

Use simple, descriptive commits. Examples:

- `feat: add worker availability filters`
- `fix: prevent duplicate rating submission`
- `docs: add contributor onboarding guides`

## Review Guidelines

When reviewing:

- prioritize correctness and regressions first
- call out missing tests or missing verification steps
- keep feedback specific and actionable
- be kind and assume positive intent

## Documentation Rule

If your change affects setup, architecture, developer workflow, or contributor expectations, update the relevant file in `docs/` in the same PR.
