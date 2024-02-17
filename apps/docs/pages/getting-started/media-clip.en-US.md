# Media Clips

> From easier document, pending to be updated.

With Media Extended, [Media Fragment URI](#media-fragment-uri) can be used to restrict play range in different types of media, which allows you to create timestamps/media fragments easily. 

Here are some examples:

- internal link: `[[test.mp4#t=5,10]]`
- internal embeds: `![[test.mp4#t=5,10]]`
- external link: `[5s→10s](http://link/to/test.mp4#t=5,10`)`
- external embeds: `![](http://link/to/test.mp4#t=5,10`)`

## Media Fragment URI [#media-fragment-uri]

When specifying the URI of media for an `<audio>` or `<video>` element, you can optionally include additional information to specify the portion of the media to play. To do this, append a hash mark `#` followed by the media fragment description.

A time range is specified using the syntax:

    #t=[starttime][,endtime]

The time can be specified as:

- a number of seconds (as a floating-point value), such as `121.12`
- as an hours/minutes/seconds or minutes/seconds time separated with colons, such as `02:01.12`
    - Minutes and seconds should be within 0-59 and written in two digits, for example, `1:20` or `10:3` is invalid.

when the `starttime` is absent, it is set to the beginning of the video/audio, while `endtime` is set to the end by default if absent.

A few examples:

    http://example.com/video.ogv#t=10,20      // Specifies that the video should play the range 10 seconds through 20 seconds.
    http://example.com/video.ogv#t=,10.5      // Specifies that the video should play from the beginning through 10.5 seconds.
    http://example.com/video.ogv#t=,02:00:00  // Specifies that the video should play from the beginning through two hours.
    http://example.com/video.ogv#t=60         // Specifies that the video should start playing at 60 seconds and play through the end of the video.

For more details, see <https://www.w3.org/TR/media-frags/#naming-time>
