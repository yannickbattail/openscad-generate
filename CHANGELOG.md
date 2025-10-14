# Changelog

## [1.3.3] - 2025-10-14

### Fixed

- add quotes to openscad parameters to prevent bug with values containing spaces

### Changed

- create a changelog and update readme
- Upgrade dependencies
- add depcheck and npm-check-updates as devDependencies

## [1.3.2] - 2025-10-03

### Fixed

- `init` command does not overwrite .scad files event if --force is used

## [1.3.1] - 2025-10-03

### Added

- generate a slide show of all presets in webp or gif. New options: `generateSlideShow: "webp" | "gif" | null;` and
  `slideShowInterval: number;`
