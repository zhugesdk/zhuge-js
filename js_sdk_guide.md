# Javascript SDK 集成指南

## 注册应用，获取Appkey
在集成SDK之前，您首先需要到诸葛官网注册并且添加新应用，添加成功后，会自动获得AppKey。

## 安装Javascript库
在每个页面的&lt;head&gt;和&lt;/head&gt;标签之中，嵌入下面代码。
**注意把AppKey替换为你自己项目的AppKey。**



    <script type="text/javascript">
    window.zhuge=window.zhuge||[];window.zhuge.methods="_init debug identify track trackLink trackForm page".split(" ");window.zhuge.factory=function(b){return function(){var a=Array.prototype.slice.call(arguments);a.unshift(b);window.zhuge.push(a);return window.zhuge}};for(var i=0;i<window.zhuge.methods.length;i++){var key=window.zhuge.methods[i];window.zhuge[key]=window.zhuge.factory(key)};window.zhuge.load=function(b,x){if(!document.getElementById("zhuge-js")){var a=document.createElement("script");a.type="text/javascript";a.id="zhuge-js";a.async=!0;a.src="https://zgsdk.37degree.com/zhuge-lastest.min.js";var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c);window.zhuge._init(b,x)}};
    window.zhuge.load('Your App Key');
    </script>



上面代码会异步下载zhuge.min.js库，并创建一个全局变量zhuge。  
load方法中需要传入您自己的AppKey。  
page方法是记录当前页面的访问，需要每个页面都调用。  

## 识别用户
为了把页面访问、自定义事件等记录的用户行为与每个用户关联起来，需要通过identify方法来识别用户信息，
您可以通过该方法记录用户的自定义ID和详细信息，通常在登录后调用一次该方法即可。

参数：  
    ***userId*** 用户的唯一ID  
    ***properties*** 用户的属性

示例代码：


        zhuge.identify('122122', {
            email: 'info@zhuge.io',
            '行业': '互联网'
        });

#### 预定义的属性：

为了便于分析和页面显示，我们抽取了一些共同的属性，要统计以下数据时，可按照下面格式填写。 

|属性Key     | 说明        | 
|--------|-------------|
|name    | 名称|
|gender  | 性别(值:男,女)|
|birthday| 生日(格式: yyyy/MM/dd)|
|avatar   | 头像地址|
|email   | 邮箱|
|mobile   | 手机号|
|qq      | QQ账号|
|weixin  | 微信账号|
|weibo   | 微博账号|
|location   | 地域，如北京|

**长度限制**:Key最长支持25个字符，Value最长支持255个字符，一个汉字按3个字符计算。



## 自定义事件
track方法用来跟踪一些自定义事件，自定义事件可以记录一些用户的关键行为，
通过对这些行为的分析可以更好的了解用户如何使用您的产品。

参数：  
    ***event*** 事件名称  
    ***properties*** 事件的属性

示例代码：


    zhuge.track('购买手机', {
        '手机': '小米4',
        '价格': 1799,
        '运营商': '移动'
    });

