var TouchSlide=function(e){e=e||{};var t={slideCell:e.slideCell||"#touchSlide",titCell:e.titCell||".hd li",mainCell:e.mainCell||".bd",effect:e.effect||"left",autoPlay:e.autoPlay||!1,autoHover:e.autoHover||!1,delayTime:e.delayTime||200,interTime:e.interTime||2500,defaultIndex:e.defaultIndex||0,titOnClassName:e.titOnClassName||"on",autoPage:e.autoPage||!1,prevCell:e.prevCell||".prev",nextCell:e.nextCell||".next",pageStateCell:e.pageStateCell||".pageState",pnLoop:"undefined "==e.pnLoop?!0:e.pnLoop,startFun:e.startFun||null,endFun:e.endFun||null,switchLoad:e.switchLoad||null},n=document.getElementById(t.slideCell.replace("#",""));if(!n)return!1;var a=function(e,t){e=e.split(" ");var n=[];t=t||document;var a=[t];for(var l in e)0!=e[l].length&&n.push(e[l]);for(var l in n){if(0==a.length)return!1;var i=[];for(var r in a)if("#"==n[l][0])i.push(document.getElementById(n[l].replace("#","")));else if("."==n[l][0])for(var o=a[r].getElementsByTagName("*"),s=0;s<o.length;s++){var c=o[s].className;c&&-1!=c.search(new RegExp("\\b"+n[l].replace(".","")+"\\b"))&&i.push(o[s])}else for(var o=a[r].getElementsByTagName(n[l]),s=0;s<o.length;s++)i.push(o[s]);a=i}return 0==a.length||a[0]==t?!1:a},l=function(e,t){var n=document.createElement("div");n.innerHTML=t,n=n.children[0];var a=e.cloneNode(!0);return n.appendChild(a),e.parentNode.replaceChild(n,e),f=a,n},i=function(e,t){!e||!t||e.className&&-1!=e.className.search(new RegExp("\\b"+t+"\\b"))||(e.className+=(e.className?" ":"")+t)},r=function(e,t){!e||!t||e.className&&-1==e.className.search(new RegExp("\\b"+t+"\\b"))||(e.className=e.className.replace(new RegExp("\\s*\\b"+t+"\\b","g"),""))},o=t.effect,s=a(t.prevCell,n)[0],c=a(t.nextCell,n)[0],u=a(t.pageStateCell)[0],f=a(t.mainCell,n)[0];if(!f)return!1;var d,p,v=f.children.length,m=a(t.titCell,n),h=m?m.length:v,g=t.switchLoad,T=parseInt(t.defaultIndex),L=parseInt(t.delayTime),b=parseInt(t.interTime),C="false"==t.autoPlay||0==t.autoPlay?!1:!0,w=("false"==t.autoHover||0==t.autoHover?!1:!0,"false"==t.autoPage||0==t.autoPage?!1:!0),y="false"==t.pnLoop||0==t.pnLoop?!1:!0,x=T,N=null,E=null,I=null,P=0,k=0,M=0,S=0,F=/hp-tablet/gi.test(navigator.appVersion),H="ontouchstart"in window&&!F,D=H?"touchstart":"mousedown",B=H?"touchmove":"",O=H?"touchend":"mouseup",A=f.parentNode.clientWidth,R=v;if(0==h&&(h=v),w){h=v,m=m[0],m.innerHTML="";var z="";if(1==t.autoPage||"true"==t.autoPage)for(var W=0;h>W;W++)z+="<li>"+(W+1)+"</li>";else for(var W=0;h>W;W++)z+=t.autoPage.replace("$",W+1);m.innerHTML=z,m=m.children}"leftLoop"==o&&(R+=2,f.appendChild(f.children[0].cloneNode(!0)),f.insertBefore(f.children[v-1].cloneNode(!0),f.children[0])),d=l(f,'<div class="tempWrap" style="overflow:hidden; position:relative;"></div>'),f.style.cssText="width:"+R*A+"px;position:relative;overflow:hidden;padding:0;margin:0;";for(var W=0;R>W;W++)f.children[W].style.cssText="display:table-cell;vertical-align:top;width:"+A+"px";var X=function(){"function"==typeof t.startFun&&t.startFun(T,h)},Y=function(){"function"==typeof t.endFun&&t.endFun(T,h)},V=function(e){var t=("leftLoop"==o?T+1:T)+e,n=function(e){for(var t=f.children[e].getElementsByTagName("img"),n=0;n<t.length;n++)t[n].getAttribute(g)&&(t[n].setAttribute("src",t[n].getAttribute(g)),t[n].removeAttribute(g))};if(n(t),"leftLoop"==o)switch(t){case 0:n(v);break;case 1:n(v+1);break;case v:n(0);break;case v+1:n(1)}},Z=function(){A=d.clientWidth,f.style.width=R*A+"px";for(var e=0;R>e;e++)f.children[e].style.width=A+"px";var t="leftLoop"==o?T+1:T;j(-t*A,0)};window.addEventListener("resize",Z,!1);var j=function(e,t,n){n=n?n.style:f.style,n.webkitTransitionDuration=n.MozTransitionDuration=n.msTransitionDuration=n.OTransitionDuration=n.transitionDuration=t+"ms",n.webkitTransform="translate("+e+"px,0)translateZ(0)",n.msTransform=n.MozTransform=n.OTransform="translateX("+e+"px)"},q=function(e){switch(o){case"left":T>=h?T=e?T-1:0:0>T&&(T=e?0:h-1),null!=g&&V(0),j(-T*A,L),x=T;break;case"leftLoop":null!=g&&V(0),j(-(T+1)*A,L),-1==T?(E=setTimeout(function(){j(-h*A,0)},L),T=h-1):T==h&&(E=setTimeout(function(){j(-A,0)},L),T=0),x=T}X(),I=setTimeout(function(){Y()},L);for(var n=0;h>n;n++)r(m[n],t.titOnClassName),n==T&&i(m[n],t.titOnClassName);0==y&&(r(c,"nextStop"),r(s,"prevStop"),0==T?i(s,"prevStop"):T==h-1&&i(c,"nextStop")),u&&(u.innerHTML="<span>"+(T+1)+"</span>/"+h)},G=function(){clearTimeout(E),clearTimeout(I),clearTimeout(N),J()},J=function(){C&&(clearInterval(N),N=setInterval(function(){T++,q()},b))},K=function(){C&&$(n).hover(function(){clearInterval(N),clearTimeout(N)},function(){J()})};if(q(),J(),K(),m)for(var W=0;h>W;W++)!function(){var e=W;m[e].addEventListener("click",function(t){G(),T=e,q()})}();c&&c.addEventListener("click",function(e){(1==y||T!=h-1)&&(G(),T++,q(),J())}),s&&s.addEventListener("click",function(e){(1==y||0!=T)&&(G(),T--,q(),J())});var Q=function(e){clearTimeout(E),clearTimeout(I),p=void 0,M=0;var t=H?e.touches[0]:e;P=t.pageX,k=t.pageY,f.addEventListener(B,U,!1),f.addEventListener(O,_,!1)},U=function(e){if(!H||!(e.touches.length>1||e.scale&&1!==e.scale)){var t=H?e.touches[0]:e;if(M=t.pageX-P,S=t.pageY-k,"undefined"==typeof p&&(p=!!(p||Math.abs(M)<Math.abs(S))),!p){switch(e.preventDefault(),C&&clearInterval(N),o){case"left":(0==T&&M>0||T>=h-1&&0>M)&&(M=.4*M),j(-T*A+M,0);break;case"leftLoop":j(-(T+1)*A+M,0)}null!=g&&Math.abs(M)>A/3&&V(M>-0?-1:1)}}},_=function(e){0!=M&&(e.preventDefault(),p||(Math.abs(M)>A/10&&(M>0?T--:T++),q(!0),C&&(N=setInterval(function(){T++,q()},b))),f.removeEventListener(B,U,!1),f.removeEventListener(O,_,!1))};f.addEventListener(D,Q,!1)};
$(function(){
	$(".animation_tab").each(function(index, element) {
		var slideCell = {},$obj = $(this),dom_id = "animation_tab_" + index;
		$(this).attr("id",dom_id);
		dom_id = "#" + dom_id;
		slideCell['slideCell'] = dom_id;
		if($obj.attr("data-titCell")){
			slideCell['titCell'] = $obj.attr("data-titCell");
		}else if($obj.attr("data-autoPage")){
			slideCell['titCell'] = ".hd ul";
		};
		if($obj.attr("data-mainCell")){
			slideCell['mainCell'] = $obj.attr("data-mainCell");
		}
		if($obj.attr("data-effect")){
			slideCell['effect'] = $obj.attr("data-effect");
		}
		if($obj.attr("data-autoPage")){
			slideCell['autoPage'] = true;
		}
		if($obj.attr("data-pnLoop")){
			slideCell['pnLoop'] = false;
		}
		if($obj.attr("data-prevCell")){
			slideCell['prevCell'] = $obj.attr("data-prevCell");
		}
		if($obj.attr("data-nextCell")){
			slideCell['nextCell'] = $obj.attr("data-nextCell");
		}
		if($obj.attr("data-pageStateCell")){
			slideCell['pageStateCell'] = $obj.attr("data-pageStateCell");
		}else{
			slideCell['pageStateCell'] = dom_id + " .pagestate";
		};
		if($obj.attr("data-slideCell")){
			slideCell['switchLoad'] = $obj.attr("data-slideCell");
		};
		TouchSlide(slideCell);
	});
})