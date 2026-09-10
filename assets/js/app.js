// Đổi nền sáng/tối, nhóm tab, stepper, tô sáng mục lục.
// Tách từ ben-trong-kag.html.

(function(){
  // theme toggle
  var root=document.documentElement, btn=document.getElementById('themeBtn');
  try{ var saved=localStorage.getItem('kag-theme'); if(saved) root.setAttribute('data-theme',saved); }catch(e){}
  btn.addEventListener('click',function(){
    var cur=root.getAttribute('data-theme');
    var next;
    if(cur==='dark'){ next='light'; }
    else if(cur==='light'){ next='dark'; }
    else { next=window.matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark'; }
    root.setAttribute('data-theme',next);
    root.style.display='none'; void root.offsetHeight; root.style.display='';
    try{ localStorage.setItem('kag-theme',next); }catch(e){}
  });

  // generic tab group wiring
  function wire(container){
    var tabs=Array.prototype.slice.call(container.querySelectorAll('[role="tab"]'));
    tabs.forEach(function(tab,i){
      tab.setAttribute('tabindex', tab.getAttribute('aria-selected')==='true' ? '0' : '-1');
      tab.addEventListener('click',function(){ select(i); });
      tab.addEventListener('keydown',function(e){
        var d = e.key==='ArrowRight' ? 1 : e.key==='ArrowLeft' ? -1 : 0;
        if(!d) return;
        e.preventDefault();
        select((i+d+tabs.length)%tabs.length, true);
      });
    });
    function select(i,focus){
      tabs.forEach(function(t,j){
        var on = i===j;
        t.setAttribute('aria-selected', on?'true':'false');
        t.setAttribute('tabindex', on?'0':'-1');
        var p=document.getElementById(t.getAttribute('aria-controls'));
        if(p) p.hidden = !on;
      });
      if(focus) tabs[i].focus();
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), wire);

  // toc highlight
  var links=Array.prototype.slice.call(document.querySelectorAll('#toc a'));
  var secs=links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if('IntersectionObserver' in window && secs.length){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        links.forEach(function(l){ l.classList.toggle('on', l.getAttribute('href')==='#'+en.target.id); });
      });
    },{rootMargin:'-15% 0px -70% 0px'});
    secs.forEach(function(s){ io.observe(s); });
  }
})();
