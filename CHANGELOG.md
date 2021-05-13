# [2.3.0](https://github.com/alx-plugins/media-extended/compare/2.2.1...2.3.0) (2021-05-13)


### Bug Fixes

* **handlers.ts:** directlink external embed should respond to temporal fragment now ([fcea4e1](https://github.com/alx-plugins/media-extended/commit/fcea4e1454d91877d740d8a4794450a530800209))
* **playersetup.ts:** looped media without temporal fragement should work again ([a7bf7a6](https://github.com/alx-plugins/media-extended/commit/a7bf7a6ee32cb6e22f2c2a1cae913e440f07ad9f))


### Features

* add setting for thumbnailPlaceholder ([411b1de](https://github.com/alx-plugins/media-extended/commit/411b1deda424199afc7720db5c7e4c4ee10648f3))
* **videohosttools.ts:** add thumbnail support for vimeo and bilibili video ([3e3d5d4](https://github.com/alx-plugins/media-extended/commit/3e3d5d48acf0149219cb2e2844da162e7d8c05d7))
* **videohosttools.ts:** add thumbnail support for youtube video ([c927ede](https://github.com/alx-plugins/media-extended/commit/c927eded0e3f2d0b090f15ca7ecaa00f3ea710ae))
* add unregister method for MarkdownPostProcessor ([d6e39b9](https://github.com/alx-plugins/media-extended/commit/d6e39b90f9f65f9c7cf6575c377d33f8f7fb030f))

## [2.2.1](https://github.com/alx-plugins/media-extended/compare/2.2.0...2.2.1) (2021-05-12)


### Bug Fixes

* **embed-process.ts:** player no longer paused when first loop ends ([d0f8e24](https://github.com/alx-plugins/media-extended/commit/d0f8e24686579bf31e79e67c66fad12a161e58ca)), closes [#21](https://github.com/alx-plugins/media-extended/issues/21)
* **processor.ts:** fix loop tag not attached to player in processInternalLinks() ([8e933dd](https://github.com/alx-plugins/media-extended/commit/8e933dd3cdc962adc8b9314590789f7c559db8f1))
* **processor.ts:** internal timestamp link now works with audio files again ([c5d5afa](https://github.com/alx-plugins/media-extended/commit/c5d5afaf74449d6cd36e386e8c73384b0cd87d3d)), closes [#20](https://github.com/alx-plugins/media-extended/issues/20)

# [2.2.0](https://github.com/alx-plugins/media-extended/compare/2.1.0...2.2.0) (2021-04-15)


### Features

* add youtube short link support ([18bef61](https://github.com/alx-plugins/media-extended/commit/18bef6158eb0001b7987886be694b167cc2e0b67))

# [2.1.0](https://github.com/alx-plugins/media-extended/compare/2.0.0...2.1.0) (2021-04-14)


### Bug Fixes

* **styles.css:** fix misaligned slider-thumb ([77faab4](https://github.com/alx-plugins/media-extended/commit/77faab47fb6c05bf1bad227e8309d45a0b3908be))


### Features

* **embed-process.ts:** add vimeo support ([3962151](https://github.com/alx-plugins/media-extended/commit/3962151e775557685639a3a56708fdef2d750c61))
* **embed-process.ts:** allow youtube video timestamp control ([c93e2ac](https://github.com/alx-plugins/media-extended/commit/c93e2acc939ae77997a8e76b196e8ccdae5977a3))
* **embed-process.ts:** use plyr as youtube player ([09d1993](https://github.com/alx-plugins/media-extended/commit/09d19938c8d744136c493562ad6e3d6e87e0821a))
* **processor.ts:** update bilibili iframe rules ([6866dd7](https://github.com/alx-plugins/media-extended/commit/6866dd788f5fb1d76626e40fab21bf76c45ee7a0))
* **styles.css:** hide annoying "more videos" when paused for youtube video ([6966c07](https://github.com/alx-plugins/media-extended/commit/6966c07981dbda096368e639b0c70aa19e844100))

# [2.0.0](https://github.com/alx-plugins/media-extended/compare/1.0.1...2.0.0) (2021-04-12)


### Code Refactoring

* **processor.ts:** extract util function injectTimestamp() ([ef17898](https://github.com/alx-plugins/media-extended/commit/ef1789833f641db0aec678c3cbe22bb5a393419b))


### Features

* **processor.ts:** add external video hosts (Youtube, bilibili) embed support ([4708cd5](https://github.com/alx-plugins/media-extended/commit/4708cd5ac139ea533633dd1c52363ed7ef37a93d))


### BREAKING CHANGES

* **processor.ts:** now HME_TF is renamed to HTMLMediaEl_TF

## [1.0.1](https://github.com/alx-plugins/media-extended/compare/1.0.0...1.0.1) (2021-04-10)


### Bug Fixes

* change internalEmbedObs.disconnect() behavior to respond to media fallback ([4a277dc](https://github.com/alx-plugins/media-extended/commit/4a277dc266976ed8caf1a16672e519de18c646a8)), closes [#4](https://github.com/alx-plugins/media-extended/issues/4)



# [1.0.0](https://github.com/alx-plugins/media-extended/compare/1.0.0...1.0.1) (2021-04-06)

