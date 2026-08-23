# Changelog

## [1.4.6] - 2026-08-23

### Added

- save thingiverse ID in configuration file
- update command scan for photos in folder photos

## [1.4.5] - 2026-08-22

### Added

- add command : update configuration files
- set deployment files and images in the configuration file
- automatic get token from the browser

### Fixed

- init generate script and placeholder

## [1.3.6] - 2026-05-19

### Added

- handle new experimental features: vector-swizzle

## [1.3.5] - 2025-11-19

### Added

- handle new experimental features: vector-swizzle

## [1.3.4] - 2025-10-14

### Fixed

- add quotes to parameters to fix bug on generated animation and slide show.

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
