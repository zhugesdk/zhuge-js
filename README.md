快速开始
---------------
1、 在每个页面的`<head>`和`</head>`标签之中，嵌入下面代码:
```js
<script type="text/javascript">
window.zhuge=window.zhuge||[];window.zhuge.methods="_init debug identify track trackLink trackForm page".split(" ");window.zhuge.factory=function(b){return function(){var a=Array.prototype.slice.call(arguments);a.unshift(b);window.zhuge.push(a);return window.zhuge}};for(var i=0;i<window.zhuge.methods.length;i++){var key=window.zhuge.methods[i];window.zhuge[key]=window.zhuge.factory(key)};window.zhuge.load=function(b){if(!document.getElementById("zhuge-js")){var a=document.createElement("script");a.type="text/javascript";a.id="zhuge-js";a.async=!0;a.src="https://zgsdk.37degree.com/zhuge-1.1.min.js";var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c);window.zhuge._init(b)}};
window.zhuge.load('Your App Key');
window.zhuge.page();
</script>
```

2、 开始追踪用户行为:

```js
zhuge.track('购买手机', {
  '手机': '小米4',
  '价格': 1799,
  '运营商': '移动'
});
```

**了解更多 [完整文档 »](http://docs.zhuge.io/sdks/javascript)**
