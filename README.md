# Sebastian Alvarez's portfolio

A standalone Blazor WebAssembly portfolio hosted on Firebase Hosting.

## Run locally

Install the .NET 9 SDK, then run from the repository root:

```sh
dotnet run --project ResumePortfolio.csproj
```

## Featured projects

`Components/FeaturedProjects.razor` contains the two project cards, their previews,
and their destinations:

- **AlphaScope:** https://exotics-79c0b.web.app/
- **Fluxion:** https://github.com/Mirrihk/Fluxion

The tile scrolls vertically every **6 seconds**. Change `RotationIntervalMs` in
that component to adjust the interval. Replace the Fluxion SVG in the component
when a software demo or screenshot is available.

Hovering temporarily pauses rotation. Focusing a project or using the arrows or
numbered controls pauses it until **Play** is selected. Arrow keys also switch
projects. Reduced-motion preferences disable autoplay and animation by default;
visitors can still choose Play. Hidden tabs pause the timer, and leaving the page
cleans up its listeners and animations.

The AlphaScope preview is an illustrative HTML preview of its search screen;
opening the card loads the actual website. It does not fetch market data or embed
the other site. Fluxion retains the portfolio's graph illustration.

## Publish to Firebase Hosting

Both GitHub Actions workflows build the .NET source before uploading the site.
They publish to `artifacts/firebase/wwwroot`, matching `firebase.json`. The
Visual Studio folder publish profile uses the same output folder. The old
committed `public` and `firebase-dist` folders are not deployment inputs.

For a manual deployment, run from the repository root:

```sh
dotnet publish ResumePortfolio.csproj --configuration Release --output artifacts/firebase
npx firebase-tools deploy --only hosting
```

The carousel runs entirely in the browser and adds no backend service.
