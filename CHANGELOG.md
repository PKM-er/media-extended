## [2.10.3](https://github.com/aidenlx/media-extended/compare/2.10.2...2.10.3) (2021-07-30)


### Bug Fixes

* fix cursor not move when insert timestamp on mobile ([5c482a9](https://github.com/aidenlx/media-extended/commit/5c482a9344167f371015d23d529c9c5a307207a7))
* fix media-view not unload properly ([fc35ce2](https://github.com/aidenlx/media-extended/commit/fc35ce2499e94cc1ef81168ec1594a2c47b822b5))
* fix video embeds not be able to enter fullscreen on iOS ([e1380d6](https://github.com/aidenlx/media-extended/commit/e1380d69e91e660a74743845dc77d57c92f548e9))
* **media-view:** video player now fill the page properly ([cf0ad0c](https://github.com/aidenlx/media-extended/commit/cf0ad0c4de15112d260c6e996a74913ab3c17270))

## [2.10.2](https://github.com/aidenlx/media-extended/compare/2.10.1...2.10.2) (2021-07-30)


### Bug Fixes

* fix video set in max-ratio-width even in fullscreen ([da60635](https://github.com/aidenlx/media-extended/commit/da60635fc93518fa98a5cac4323f72b22832a7ab))

## [2.10.1](https://github.com/aidenlx/media-extended/compare/2.10.0...2.10.1) (2021-07-30)


### Bug Fixes

* **plyr-controls:** fix icon empty when first open; fix custom theme break checked style ([45fadc9](https://github.com/aidenlx/media-extended/commit/45fadc990fc123d462444457d03338673f0aebcf))

# [2.10.0](https://github.com/aidenlx/media-extended/compare/2.9.0...2.10.0) (2021-07-29)


### Bug Fixes

* **embeds:** fix sometimes fail to get and set up ratio ([fa99d2a](https://github.com/aidenlx/media-extended/commit/fa99d2ad1c991435d7cac5b45e185b0e1cef3391)); increse retrys for ratio setup ([a80fb46](https://github.com/aidenlx/media-extended/commit/a80fb4695772fc7ba36ccb8606609baf21359ca9)), closes [#55](https://github.com/aidenlx/media-extended/issues/55)
* fix dash not destroyed with plyr instance ([c809fd4](https://github.com/aidenlx/media-extended/commit/c809fd4f575381f1027547d51b5d579526de3722))
* fix leaf with media view fail to switch view or close when not grouped ([58e25aa](https://github.com/aidenlx/media-extended/commit/58e25aa67f00a999c5cf95e0f91bb010ba981c22))
* fix subtitle covered by control padding-top ([f342305](https://github.com/aidenlx/media-extended/commit/f342305118bbd8519dd3542d3aa8d3f016e6135b))
* fix subtitle unable to be selected ([ec38c66](https://github.com/aidenlx/media-extended/commit/ec38c663792a86c4998e3d9f26a8d2eb8d85a0a5))
* fix trying to set ratio on audio player ([aec5b52](https://github.com/aidenlx/media-extended/commit/aec5b52394ebc772cffd56678fc50158fb6edbf7))
* **plyr-controls:** fix el style of plyr-controls settings on mobile ([4221e63](https://github.com/aidenlx/media-extended/commit/4221e638d097e95e3a54cbc27ef69583b903fad5))
* **plyr-controls:** fix plyr-controls not align to center ([4e2b865](https://github.com/aidenlx/media-extended/commit/4e2b865f22f2292e41a9e244b4c4958f1ec1a60d))
* unload monkey patch ([ec19401](https://github.com/aidenlx/media-extended/commit/ec19401fc17824f04b2f62377b470faeded95a24))


### Features

* official mobile support
  * add separate settings of player size controls for mobile ([f903e3a](https://github.com/aidenlx/media-extended/commit/f903e3a5715bfa5522c30f366893f6a5d2c6aed4))
  * **media-view:** link now respect screen aspect ratio when open new view; add close button for mobile ([7ed695f](https://github.com/aidenlx/media-extended/commit/7ed695f038ae3738a62742a8be1ac208c6e71243))
* add bilibili page support ([ce2376a](https://github.com/aidenlx/media-extended/commit/ce2376a90cd1be15fff4a20dbf709585e28c1bbc)), closes [#51](https://github.com/aidenlx/media-extended/issues/51)
* allow to open media view from file explorer ([167e06b](https://github.com/aidenlx/media-extended/commit/167e06b8f43dc398cac9466050923e84c8af8a77)), closes [#53](https://github.com/aidenlx/media-extended/issues/53)
* **media-view:** add speed control to more option menu ([72ad42c](https://github.com/aidenlx/media-extended/commit/72ad42c53778fcf3835f31ed539e32b457c392cc)), closes [#52](https://github.com/aidenlx/media-extended/issues/52)
* take timestamp from audio-recorder ([2db1bb6](https://github.com/aidenlx/media-extended/commit/2db1bb692a01b47805cc00968f960d5cdc31b259)), closes [#45](https://github.com/aidenlx/media-extended/issues/45)

# [2.9.0](https://github.com/aidenlx/media-extended/compare/2.8.1...2.9.0) (2021-07-26)


### Bug Fixes

* disable cm5 link click override on mobile ([4f68289](https://github.com/aidenlx/media-extended/commit/4f6828917dace971d859a66e555711687124e33c))
* fix 9:16 video not in center ([982cb0f](https://github.com/aidenlx/media-extended/commit/982cb0f141224908496d1de0c20a946d6bd61fbe))
* fix audio player height problem ([f87bba1](https://github.com/aidenlx/media-extended/commit/f87bba1afece1859854d134cb9a7f3849fa1316e))
* fix bili poster size ([1cb27d4](https://github.com/aidenlx/media-extended/commit/1cb27d4f1dc1301129f286a7babc391ff0f12153))
* fix link open blank media view when internal bili disabled ([00db550](https://github.com/aidenlx/media-extended/commit/00db55020bc219453edb4bf57209a17bda693a0d))
* fix local video sometimes fail to get ratio ([aa7b34c](https://github.com/aidenlx/media-extended/commit/aa7b34cf3cfdac8ee8f28bcb83b293e3b7f9035b))
* fix placeholder size; remove placeholder from bili videos ([b3db796](https://github.com/aidenlx/media-extended/commit/b3db796ba343c078d0592c30e373db5797a77bbf))
* move bili video support to aidenlx/mx-bili-plugin ([1607de0](https://github.com/aidenlx/media-extended/commit/1607de0f41a6aabffea93be9392e315d5c67d503))


### Features

* add inline size control for media embeds ([0328980](https://github.com/aidenlx/media-extended/commit/03289806e6f420708fe97d87ea56fb3b6010c4b7)), closes [#11](https://github.com/aidenlx/media-extended/issues/11)
* add min-width setting for embed ([53de1e7](https://github.com/aidenlx/media-extended/commit/53de1e7799b4a3397d38eeeb4c2dd1f2bf6ac44b)), closes [#50](https://github.com/aidenlx/media-extended/issues/50)
* add open media link command and button in view ([f34b55b](https://github.com/aidenlx/media-extended/commit/f34b55b4d8c9c11ece39418dce4ec2e7ea13fafd))
* add option to disable controls on embeds by default ([c0da866](https://github.com/aidenlx/media-extended/commit/c0da866b9e4f7786caa14992da087a7b77a61b7c))
* add setting for embed height; adjust default settings ([0cb7462](https://github.com/aidenlx/media-extended/commit/0cb7462fa5d530ba9499c2c1e1b814428e30a7b8))
* add setting to enable blur on pause for youtube videos ([d60d131](https://github.com/aidenlx/media-extended/commit/d60d131f2ade61d2861befe9c268060446fb8de9)), closes [#40](https://github.com/aidenlx/media-extended/issues/40)
* add setting to show/hide plyr controls ([bd87725](https://github.com/aidenlx/media-extended/commit/bd87725182cca5e4436149a4394893f1eeb83b3c)), closes [#49](https://github.com/aidenlx/media-extended/issues/49)
* add support for markdown-favor internal embeds ([b351cda](https://github.com/aidenlx/media-extended/commit/b351cda57d932b9925c74b8babf744a5888f70d3))
* media view can now resume progress when vault reopens ([fc54c00](https://github.com/aidenlx/media-extended/commit/fc54c00189ce86d9ef64e22b8d5a673570359c7f))
* **media-view:** add empty page; state of opened view is saved ([f7a0b15](https://github.com/aidenlx/media-extended/commit/f7a0b15230c44717c4e22aa47a37c8f5be5ef418)), closes [#42](https://github.com/aidenlx/media-extended/issues/42)
* timestamp template support ([a31fc02](https://github.com/aidenlx/media-extended/commit/a31fc0285b3a7492023573874dea45e22785d27f)), closes [#32](https://github.com/aidenlx/media-extended/issues/32)

## [2.8.1](https://github.com/aidenlx/media-extended/compare/2.8.0...2.8.1) (2021-07-17)

# [2.8.0](https://github.com/aidenlx/media-extended/compare/2.7.2...2.8.0) (2021-07-17)


### Bug Fixes

* bili on mobile no longer use placeholder when option is enabled; update iframe sizing ([911e7ae](https://github.com/aidenlx/media-extended/commit/911e7ae32ff696fe028bfb4b5c110fbe70b162cd))
* fix adaptive aspect ratio; fix audio el height ([8e18ce2](https://github.com/aidenlx/media-extended/commit/8e18ce2af55abb4a584183a8faaad78e9fbbe336)), closes [#35](https://github.com/aidenlx/media-extended/issues/35) [#47](https://github.com/aidenlx/media-extended/issues/47)
* fix cmLink not working ([dd6b42d](https://github.com/aidenlx/media-extended/commit/dd6b42d4cab55c83ff07be58499b201e0958bc11))
* fix thumbnail creation ([6b640b4](https://github.com/aidenlx/media-extended/commit/6b640b42e90aa539435291619808e68a5f4128c9))
* fix unspecified radix of parseInt() ([ca058d4](https://github.com/aidenlx/media-extended/commit/ca058d471a167cd0d894a45a20e301f5a1c2ef85))
* fix webm audio treated as video in media view ([7b96132](https://github.com/aidenlx/media-extended/commit/7b96132f77e1aae8fdbb8da43e8db7f251c80c4b))
* **main.css:** fix .yt-controls not working ([ba718a1](https://github.com/aidenlx/media-extended/commit/ba718a142ae9b015c6394459adb8346c25bdf478))
* minor bug fix and code formatting ([932e6db](https://github.com/aidenlx/media-extended/commit/932e6db723a4b2bc27b92b3578ee5b1ce11cfaf9))
* **src/routers/fake.ts:** fix pathRewrite result missing "/" ([6d9bbaf](https://github.com/aidenlx/media-extended/commit/6d9bbaf271d140af6bb9d555cbed916a3a0ac634))
* **video-info:** fix error when resolving non-existing file ([ce96be9](https://github.com/aidenlx/media-extended/commit/ce96be94be9a26e34be37dd8ee322fe8fb961f43))


### Features

* add bilibili timestamp support ([ee8c158](https://github.com/aidenlx/media-extended/commit/ee8c1586244902a5848b036c960166243dcf97d9))
* add bilibili video initial support ([99b70df](https://github.com/aidenlx/media-extended/commit/99b70df87de8a0c46bc1931ec425efd9a95751d1))
* add fallback for bili video on mobile; placeholder support on bili internal player ([31fbdcd](https://github.com/aidenlx/media-extended/commit/31fbdcdd0d5c2f5099540e026b38c03f502ed8cb))
* add settings and unload function for bili-fake ([5d80fe7](https://github.com/aidenlx/media-extended/commit/5d80fe7320cbd80f49744aa057d6c3fdd6c4dd2c))
* allow bilibili internal playback ([d551db2](https://github.com/aidenlx/media-extended/commit/d551db2f179ae62fc1c81351aa28ea69db22f91f))
* **player-setup:** add poster for internal bilibili player ([076030f](https://github.com/aidenlx/media-extended/commit/076030f9e8db437df97baeb2dc0ef474e434b487))
* update bilibili api ([8481f58](https://github.com/aidenlx/media-extended/commit/8481f58ebf86854f979c6e469ddb7d583bd98b7d))

## [2.7.2](https://github.com/alx-plugins/media-extended/compare/2.7.1...2.7.2) (2021-05-29)


### Bug Fixes

* **temporal-frag.ts:** convertTime() error in handling hours ([66cc014](https://github.com/alx-plugins/media-extended/commit/66cc014b6c4b0f5628a97bd4a9a0655df20b8046)), closes [#38](https://github.com/alx-plugins/media-extended/issues/38)

## [2.7.1](https://github.com/alx-plugins/media-extended/compare/2.7.0...2.7.1) (2021-05-29)


### Bug Fixes

* **external-embed.ts:** external embed syntax not working with direct links ([d2affb7](https://github.com/alx-plugins/media-extended/commit/d2affb7e2584e84874a36d6d2a26f21ab4a0aa3a)), closes [#39](https://github.com/alx-plugins/media-extended/issues/39)

# [2.7.0](https://github.com/alx-plugins/media-extended/compare/2.6.0...2.7.0) (2021-05-24)


### Bug Fixes

* **main.css:** youtube iframe no longer response to mouse when paused ([739600c](https://github.com/alx-plugins/media-extended/commit/739600cb5f081ae898e1c9dec473653a1ab16417))


### Features

* add the option to use youtube built-in controls ([990ce0b](https://github.com/alx-plugins/media-extended/commit/990ce0b582f42f882db9cb4e957a299e068eedf6))

# [2.6.0](https://github.com/alx-plugins/media-extended/compare/2.5.3...2.6.0) (2021-05-19)


### Bug Fixes

* **main.ts:** click on link boundary of external media in sourceMode no longer open link in browser ([e4beb54](https://github.com/alx-plugins/media-extended/commit/e4beb54afc38dd6eb6c2c3ebb7bd484448600556))
* **media-view.ts:** fix pip issues ([6568848](https://github.com/alx-plugins/media-extended/commit/65688482776f484248f3380a1c0e1ed628eb9990))
* **media-view.ts:** leaf with ExternalMediaView no longer sync with markdown ([bd847c7](https://github.com/alx-plugins/media-extended/commit/bd847c7325d4851404662296f83ef470dbd354e3))
* **misc.ts:** fix mainpart() return empty string when no hash in URL ([dbd205c](https://github.com/alx-plugins/media-extended/commit/dbd205cd5507bc462eb4e87d5edf795de53cdf33))
* **player-setup.ts:** fix full-screen control not showing up ([4815ea8](https://github.com/alx-plugins/media-extended/commit/4815ea840e10148e3db4d1e34cfceab9f80f8b89))


### Features

* **main.ts:** add cmd/ctrl + t as default shortcut to get timestamp ([a259f24](https://github.com/alx-plugins/media-extended/commit/a259f24634a04b548fe99220b673fb8495b89830))
* add initial support for timestamp link to external media ([837fd50](https://github.com/alx-plugins/media-extended/commit/837fd5029daa4bcffa8333e49aacf9287223402b)), closes [#14](https://github.com/alx-plugins/media-extended/issues/14)
* add internal link support for MediaView ([6b0d959](https://github.com/alx-plugins/media-extended/commit/6b0d95930eea75bc8ca11079b6aeaf7b7b3a2efe))
* **media-view.ts:** add pip toggle in MediaView ([fe82393](https://github.com/alx-plugins/media-extended/commit/fe823936fb7fe87fb6497a7d1521e38fc6cc8406))
* external media links in sourceMode is now clickable ([f70579b](https://github.com/alx-plugins/media-extended/commit/f70579bbae810e7ddc39061b7c3f9eb435668fe8))
* **main.ts:** add command to insert timestamp when in sourceMode ([a5cc2cb](https://github.com/alx-plugins/media-extended/commit/a5cc2cb6963aeacd6faa606613618678f42e1b92))
* **media-view.ts:** add group binding to ExternalMediaView ([951d17b](https://github.com/alx-plugins/media-extended/commit/951d17b8ee87d9b9fb6abd7e155dae3f2c266291))
* **media-view.ts:** initial support to insert timestamp from player to doc ([c83a982](https://github.com/alx-plugins/media-extended/commit/c83a982086cb20c3c39e3704f2c839852f1f02c3)), closes [#9](https://github.com/alx-plugins/media-extended/issues/9)

## [2.5.3](https://github.com/alx-plugins/media-extended/compare/2.5.2...2.5.3) (2021-05-17)


### Bug Fixes

* **player-setup.ts:** enable pip and fullscreen by default ([1ff6dad](https://github.com/alx-plugins/media-extended/commit/1ff6dad91e52b3273538b37948aea33b9fb6072a))
* caption is enable by default when subtitle file is present ([28539fa](https://github.com/alx-plugins/media-extended/commit/28539fa4c4706c38b8eae3ac9f88a60c024f1fb3))
* enable plyr for direct links ([4ef6f53](https://github.com/alx-plugins/media-extended/commit/4ef6f53956d9d2dd10c86998254525dc03d958a9))

## [2.5.2](https://github.com/alx-plugins/media-extended/compare/2.5.1...2.5.2) (2021-05-16)


### Bug Fixes

* **main.css:** slider-thumb no longer get misaligned across different theme ([4b47f61](https://github.com/alx-plugins/media-extended/commit/4b47f61eaf74fa0001adfbb9846161e6e6be8b61))

## [2.5.1](https://github.com/alx-plugins/media-extended/compare/2.5.0...2.5.1) (2021-05-16)


### Bug Fixes

* adjust css to fix frame size not responsive ([4d011bf](https://github.com/alx-plugins/media-extended/commit/4d011bf0fe90f3062e7f6e979f247159b5a64ea3))
* **handlers.ts:** fix internal embed not reading subtitles ([a964c0b](https://github.com/alx-plugins/media-extended/commit/a964c0b6e98b7fef6f35ac5d67cb203de0212013))
* **player-setup.ts:** fix internal webm embed not working ([7fab710](https://github.com/alx-plugins/media-extended/commit/7fab71048d5e480452982e7445fa887fa31228fb))

# [2.5.0](https://github.com/alx-plugins/media-extended/compare/2.4.0...2.5.0) (2021-05-15)


### Bug Fixes

* subtitle can be selected and selection color is adjusted ([8641f84](https://github.com/alx-plugins/media-extended/commit/8641f840efd2c614940ad1dfdbd2db63b00c339a))
* **handlemedia:** plyr should work with internal embeds with hash now ([078f807](https://github.com/alx-plugins/media-extended/commit/078f8071d8fb89c6429303e7a44d5cba70f0db34))
* config plyr to respond to div.external-video size setting ([8ad5570](https://github.com/alx-plugins/media-extended/commit/8ad557095ff778b5ca2e79a67703741cabc3271a))


### Features

* add inline autoplay support ([12ebe8f](https://github.com/alx-plugins/media-extended/commit/12ebe8fc1c95ce59a37e13be0644f83daf13ee8c))
* **getsetuptool():** add inline mute support ([86a5a2a](https://github.com/alx-plugins/media-extended/commit/86a5a2a7d43e708f4386254a878b0a4b4bc98b7e))
* add global plyr size control ([d42f369](https://github.com/alx-plugins/media-extended/commit/d42f369e1fb6a0131903b79abdefeebf584b4aa0))

# [2.4.0](https://github.com/alx-plugins/media-extended/compare/2.3.0...2.4.0) (2021-05-14)


### Bug Fixes

* add filterDuplicates() for MutationRecord[] to avoid duplicate calls ([c256db6](https://github.com/alx-plugins/media-extended/commit/c256db6d988937eeefe08f4504fde04803821b58))


### Features

* add local subtitle support; set plyr as default local media player ([c005b9f](https://github.com/alx-plugins/media-extended/commit/c005b9fc7628a7b530b0d142660d9b65f9dd784e)), closes [#7](https://github.com/alx-plugins/media-extended/issues/7) [#25](https://github.com/alx-plugins/media-extended/issues/25)
* add toolkit to load local subtitle ([fddf2d3](https://github.com/alx-plugins/media-extended/commit/fddf2d3839ab8e0942afd7f70cb6ddf4742cf14f))

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

