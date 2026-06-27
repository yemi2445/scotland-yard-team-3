# scotland-yard-team-3

COM5403 Team 3 The Leeds Files - Manhunt (Scotland Yard) Scrum

## Project Structure

This is a TypeScript monorepo using Turborepo for maximum code sharing between web, mobile, and backend.

```
scotland-yard-team-3/
├── apps/
│   ├── web/          # Next.js (Web Overview) - http://localhost:3000
│   ├── mobile/       # Expo (Mobile App) - iOS/Android/Web - http://localhost:3001
│   └── backend/      # Express + TypeScript (REST API) - http://localhost:3002
├── packages/
│   ├── ui/           # Shared React components (Button, etc.)
│   ├── types/        # Shared TypeScript interfaces (Game, Player, Move)
│   ├── api/          # Shared API client for REST calls
│   └── config/       # Shared TypeScript config
├── package.json      # Root monorepo config
└── turbo.json        # Build pipeline
```

## Getting Started

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start app including web, mobile, and backend:

    ```bash
    npx turbo dev
    ```

## Shared Code

- **Types**: All apps share the same game interfaces to ensure consistency.
- **API Client**: Both web and mobile use the same functions to call the backend.
- **UI Components**: Reusable React components for consistent styling.

## Collaboration With Branches and Pull Requests

### Making A Pull Request

- Create a new branch for including the sprint num your name and kanban todo, feature or fix in the branch name, e.g. `sprint1-ben-add-move-validation`.
- Push your branch to GitHub and actively create small commits to this branch and push as you work on the feature.
- When your feature is ready, create a pull request to the `master` branch and request reviews from all team members.
- Address any feedback and once approved, merge your pull request to `master`.

### Reviewing Pull Requests

- When a pull request is created, all team members should review the code changes.
- Provide constructive feedback and ask questions if anything is unclear.
- Check the files changes section such as [here](https://github.com/Bentheborg/scotland-yard-team-3/pull/2/changes)
- And press the submit comment button to submit your review.

## License

MIT
