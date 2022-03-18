/* eslint-disable */
(function (e) {
  function t(t, n, i, r) {
    var o = e.call(this) || this;
    (o.sourcePath = n), (o.href = i);
    var s = (o.containerEl = createDiv("internal-embed"));
    (s.tabIndex = -1), s.setAttr("src", i), o.applyTitle(r);
    var a = QB.load({
      app: t,
      linktext: i,
      sourcePath: n,
      containerEl: s,
      displayMode: !1,
      showTitle: !0,
      remainingNestLevel: 5,
    });
    return a && ((o.child = a), a.loadFile()), o;
  }
  return (
    M(t, e),
    (t.prototype.eq = function (e) {
      return e === this;
    }),
    (t.prototype.updateDOM = function (e) {
      return !1;
    }),
    (t.prototype.toDOM = function (e) {
      var t = this.containerEl;
      return (
        this.hookClickHandler(e, t),
        this.resizeWidget(e, t),
        t.addEventListener("mousedown", function (t) {
          0 === t.button && e.hasFocus && t.preventDefault();
        }),
        t
      );
    }),
    (t.prototype.applyTitle = function (e) {
      var t = this.containerEl;
      this.title = e;
      var n = 0,
        i = 0;
      if (e) {
        var r = function (e) {
            var t = Sg(e);
            return !!t && ((n = t.x), (i = t.y), !0);
          },
          o = e.lastIndexOf("|");
        -1 !== o
          ? r(e.substr(o + 1)) && (e = e.substr(0, o))
          : r(e) && (e = "");
      }
      t.setAttr("alt", e),
        t.setAttr("width", 0 === n ? "" : String(n)),
        t.setAttr("height", 0 === i ? "" : String(i));
      var s = t.firstChild;
      s &&
        s instanceof HTMLImageElement &&
        (s.setAttr("alt", e),
        s.setAttr("width", 0 === n ? "" : String(n)),
        s.setAttr("height", 0 === i ? "" : String(i)));
    }),
    Object.defineProperty(t.prototype, "estimatedHeight", {
      get: function () {
        return 100;
      },
      enumerable: !1,
      configurable: !0,
    }),
    t
  );
});
nR = (function (e) {
  function t() {
    var t = (null !== e && e.apply(this, arguments)) || this;
    return (t.start = -1), (t.end = -1), t;
  }
  return (
    M(t, e),
    (t.prototype.setPos = function (e, t) {
      (this.start = e), (this.end = t);
    }),
    (t.prototype.hookClickHandler = function (e, t) {
      var n = this;
      t.addEventListener("click", function (i) {
        i.defaultPrevented || (n.selectElement(e, t), i.preventDefault());
      });
    }),
    (t.prototype.addEditButton = function (e, t) {
      var n = this,
        i = t.createDiv("edit-block-button");
      Xy(i, Ov),
        nn(i, "Edit this block"),
        i.addEventListener("click", function () {
          n.selectElement(e, t);
        });
    }),
    (t.prototype.selectElement = function (e, t) {
      var n = this.start,
        i = this.end;
      if (n < 0 || i < 0)
        !(function (e, t) {
          try {
            var n = t.posAtDOM(e);
            t.dispatch({ selection: { head: n, anchor: n } }), t.focus();
          } catch (e) {}
        })(t, e);
      else {
        eb.isMobile && (i = n);
        try {
          e.dispatch({ selection: { head: n, anchor: i } }), e.focus();
        } catch (e) {}
      }
    }),
    (t.prototype.resizeWidget = function (e, t) {
      XB &&
        new XB(function () {
          return e.requestMeasure();
        }).observe(t, { box: "border-box" });
    }),
    t
  );
})(ks);

function MR(mdView, cmView) {
  var app = mdView.app,
    widgetCache = [], // internal link/img
    r = []; // math block
  return lr.define({
    create: function () {
      return xs.none;
    },
    update: function (deco, tr) {
      var state = tr.state,
        recompute = true;
      (cmView.composing ||
        LR.has(cmView)) /* mouse holding (mousedown, not up yet) */ &&
        (recompute = false);
      var c = eu(state, cmView.viewport.to, 20);
      if (
        (c || (recompute = false),
        (existInEffect([tr], ZB) /** focus changed */ ||
          existInEffect([tr], Qu) /** highlight to add */ ||
          existInEffect([tr], Xu)) /* highlight to remove */ &&
          (recompute = true),
        !recompute)
      )
        return deco.map(tr.changes);
      c || (c = Zc(state));
      var doc = state.doc,
        selRanges = cmView.hasFocus ? state.selection.ranges : [],
        decoset = state.field(eh),
        isSelected = function (from, to) {
          return inArr(selRanges, from, to) || inRangeset(decoset, from, to);
        },
        mdFilePath = mdView.file ? mdView.file.path : "",
        decos = [],
        widgetCache1 = widgetCache;
      widgetCache = [];
      var v = r;
      r = [];
      var isEmbed = !1,
        embedStartFrom = -1,
        embedStartTo = -1,
        embedLTto = -1,
        linkText = "",
        isImg = !1,
        imgAltText = "",
        imgUrl = "",
        imgMarkLoc = -1,
        imgUrlFrom = -1,
        imgUrlTo = -1,
        mathFrom = -1,
        mathTo = -1,
        P = !1,
        O = -1,
        F = "",
        I = -1,
        N = "",
        setupInternalEmbed = function (linktext, from, to) {
          for (
            var s = xg(linktext),
              href = s.href,
              title = s.title,
              widget = null,
              index = 0,
              arr = widgetCache1;
            index < arr.length;
            index++
          ) {
            var widgetInCache = arr[index];
            if (
              widgetInCache.sourcePath === mdFilePath &&
              widgetInCache.href === href
            ) {
              (widget = widgetInCache), widgetCache1.remove(widgetInCache);
              break;
            }
          }
          return (
            widget
              ? widget.title !== title && widget.applyTitle(title)
              : (widget = new wR(app, mdFilePath, href, title)).child &&
                mdView.addChild(widget.child),
            widget.setPos(from, to),
            widgetCache.push(widget),
            widget
          );
        },
        addToDecos = function (widget, from, to) {
          var i = doc.lineAt(from),
            lineFrom = i.from,
            lineTo = i.to,
            lineText = i.text,
            isWholeLine =
              "" === lineText.substr(0, from - lineFrom).trim() &&
              "" === lineText.substr(to - lineFrom).trim();
          isWholeLine
            ? isSelected(lineFrom, lineTo)
              ? decos.push(
                  xs
                    .widget({ widget: widget, block: isWholeLine, side: 1 })
                    .range(lineTo),
                )
              : decos.push(
                  xs
                    .replace({ widget: widget, block: isWholeLine, side: 1 })
                    .range(lineFrom, lineTo),
                )
            : isSelected(from, to)
            ? decos.push(xs.widget({ widget: widget, side: 1 }).range(to))
            : decos.push(
                xs.replace({ widget: widget, side: 1 }).range(from, to),
              );
        };
      c.iterate({
        enter: function (t, from, to) {
          var s = t.prop(Gu);
          if (s)
            if ((_ = new Set(s.split(" "))).has("hmd-codeblock"));
            else if (_.has("formatting-math-begin"))
              (mathFrom = from), (mathTo = to), (P = _.has("math-block"));
            else if (-1 !== mathFrom) {
              if (_.has("formatting-math-end")) {
                var a = from,
                  l = to,
                  c = P,
                  h = doc.sliceString(mathTo, a);
                (p = new CR(h, c)).setPos(
                  c && h.startsWith("\n") ? mathTo + 1 : mathTo,
                  c && h.endsWith("\n") ? a - 1 : a,
                ),
                  (c =
                    c &&
                    (function (e, t) {
                      var n = doc.lineAt(e),
                        i = n.from,
                        r = n.text,
                        o = doc.lineAt(t),
                        s = o.from,
                        a = o.text;
                      return (
                        "" === r.substr(0, e - i).trim() &&
                        "" === a.substr(t - s).trim()
                      );
                    })(mathFrom, l)),
                  isSelected(mathFrom, l)
                    ? P &&
                      decos.push(
                        xs.widget({ widget: p, block: c, side: 1 }).range(l),
                      )
                    : decos.push(
                        xs
                          .replace({ widget: p, block: c, side: 1 })
                          .range(mathFrom, l),
                      ),
                  (mathFrom = -1),
                  (mathTo = -1);
              }
            } else if (_.has("formatting-link-start"))
              (isEmbed = _.has("formatting-embed")),
                (embedStartFrom = from),
                (embedStartTo = to);
            else if (embedStartFrom > -1)
              if (_.has("hmd-internal-link"))
                (linkText += doc.sliceString(from, to)), (embedLTto = to);
              else {
                if (_.has("formatting-link-end") && linkText)
                  if (isEmbed) {
                    var p = setupInternalEmbed(
                      linkText,
                      embedStartTo,
                      embedLTto,
                    );
                    addToDecos(p, embedStartFrom, to);
                  } else {
                    var m = SD((url2 = xg(linkText).href)).path;
                    app.metadataCache.getFirstLinkpathDest(m, mdFilePath) ||
                      decos.push(aR.range(embedStartTo, embedLTto));
                  }
                (linkText = ""), (embedStartFrom = -1);
              }
            else if (_.has("image-marker")) (isImg = !0), (imgMarkLoc = from);
            else if (_.has("image-alt-text") && !_.has("formatting"))
              imgAltText = doc.sliceString(from, to);
            else if (isImg && _.has("url") && !_.has("formatting"))
              (imgUrl = doc.sliceString(from, to)),
                (imgUrlFrom = from),
                (imgUrlTo = to);
            else if (isImg && imgUrl && _.has("formatting")) {
              p = void 0;
              if (fg((imgUrl = mg(imgUrl)))) {
                var url = void 0;
                try {
                  url = decodeURI(imgUrl);
                } catch (e) {
                  return;
                }
                var url2 = u00A0ToSpace(url).trim();
                p = setupInternalEmbed(url2 + "|" + imgAltText, imgMarkLoc, to);
              } // link
              else
                (imgUrl = gg(imgUrl)),
                  eb.isDesktopApp &&
                    imgUrl.startsWith("file:///") &&
                    (imgUrl =
                      "app://local/" + imgUrl.substr("file:///".length)),
                  (p = new mR(imgUrl, imgAltText)).setPos(imgUrlFrom, imgUrlTo);
              addToDecos(p, imgMarkLoc, to),
                (isImg = !1),
                (imgUrl = ""),
                (imgAltText = ""),
                (imgMarkLoc = -1),
                (imgUrlFrom = -1),
                (imgUrlTo = -1);
            } else if (_.has("hmd-html-begin")) I = from;
            else if (I > -1 && !N && _.has("tag"))
              N = doc.sliceString(from, to);
            else if (_.has("hmd-html-end") && N && !SR.contains(N)) {
              var V = to,
                q = doc.sliceString(I, V),
                j = doc.lineAt(I),
                U = doc.lineAt(V);
              c = !(function (e) {
                if (!e || !Vh.test(e)) return !1;
                if (Ih.has(e)) return Ih.get(e);
                var t, n;
                try {
                  (t = document.createElement(e)),
                    document.body.appendChild(t),
                    (n = getComputedStyle(t).display);
                } catch (e) {}
                t && document.body.removeChild(t);
                var i = n && n.startsWith("inline");
                return Ih.set(e, i), i;
              })(N);
              if (
                (doc.sliceString(j.from, I).trim() ||
                  doc.sliceString(V, U.to).trim() ||
                  ((I = j.from), (V = U.to)),
                !isSelected(I, V))
              )
                (p = new ER(app, q, c)).setPos(I, V),
                  decos.push(
                    xs.replace({ widget: p, block: c, side: 1 }).range(I, V),
                  );
              (I = -1), (N = "");
            } else
              _.has("hr") &&
                (isSelected(from, to) || decos.push(hR.range(from, to)));
          var W = t.prop(Ku);
          if (W) {
            var _;
            if ((_ = new Set(W.split(" "))).has("HyperMD-codeblock-begin")) {
              var G = doc.lineAt(from).text.match(tR);
              (F = ""), G && (F = G[2]), (O = from);
            }
            if (_.has("HyperMD-codeblock-end") && -1 !== O) {
              var K = O;
              if (((O = -1), isSelected(K, to))) return;
              if ((U = doc.lineAt(from)).number <= 1) return;
              if ((j = doc.lineAt(K)).number >= doc.lines) return;
              var $ = doc.line(j.number + 1).from,
                Y = doc.line(U.number - 1).to,
                J = doc.sliceString($, Y);
              if (kR.canRenderLang(F)) {
                for (var Q = null, X = 0, Z = v; X < Z.length; X++) {
                  var ee = Z[X];
                  if (ee.lang === F && ee.code === J) {
                    (Q = ee), v.remove(Q);
                    break;
                  }
                }
                Q || (Q = new kR(app, mdView, F, J)),
                  Q.setPos($, Y),
                  (Q.lineStart = j.number - 1),
                  (Q.lineEnd = U.number - 1),
                  r.push(Q),
                  decos.push(
                    xs.replace({ widget: Q, block: !0, side: 0 }).range(K, to),
                  );
              } else {
                var te = F;
                try {
                  var ne = CodeMirror.findModeByName(te);
                  ne && "null" !== ne.name && (te = ne.name);
                } catch (e) {}
                decos.push(iR.range(j.from, j.to)),
                  decos.push(xs.widget({ widget: new xR(te, J) }).range(j.to)),
                  decos.push(rR.range(U.from, U.to));
              }
            }
          }
        },
      });
      // call load and unload method, leave no side effect
      for (var z = 0, H = widgetCache1; z < H.length; z++) {
        var widget = H[z];
        widget.child && mdView.removeChild(widget.child);
      }
      // for (var q = 0, j = v; q < j.length; q++)
      //   for (var U = 0, W = j[q].children; U < W.length; U++) {
      //     var _ = W[U];
      //     mdView.removeChild(_);
      //   }
      return xs.set(decos, !0);
    },
    provide: function (e) {
      return Zl.decorations.from(e);
    },
  });
}

function yg(e) {
  return e.replace(vg, " ");
}
var bg = /[!"#$%&()*+,.:;<=>?@^`{|}~\/\[\]\\]/g;
function wg(e) {
  return e.replace(/[\\\x00\x08\x0B\x0C\x0E-\x1F ]/g, function (e) {
    return encodeURIComponent(e);
  });
}
function kg(e) {
  var t = e.match(/^#{1,6} (.*)/m);
  return null !== t ? t[1] : null;
}
function Cg(e) {
  return e
    .split("#")
    .filter(function (e) {
      return !!e;
    })
    .join(" > ")
    .trim();
}
function xg(e) {
  var t = "",
    n = e.indexOf("|"),
    i = n > 0;
  return (
    i
      ? ((t = e.substr(n + 1).trim()), (e = e.substr(0, n).trim()))
      : (t = Cg((e = e.trim()))),
    e.endsWith("\\") && (e = e.substr(0, e.length - 1)),
    { href: (e = yg(e).trim()), title: t, isAlias: i }
  );
}
