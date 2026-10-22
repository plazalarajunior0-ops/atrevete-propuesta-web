/* Propuesta interactiva: pinta las secciones con los datos verificados (datos.js) y maneja filtros y botones. */
(function () {
  var D = window.DATOS || {};
  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texto') n.textContent = attrs[k];
      else if (k === 'clase') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) n.append(h); });
    return n;
  }

  /* ---------- Ganchos ---------- */
  var ETQ_PILAR = { 'reír': 'Reír', conectar: 'Conectar', mostrar: 'Mostrar', vender: 'Vender' };
  var filtros = { quien: '', pilar: '' }, texto = '', limite = 12;
  function opciones(campo) {
    var vistos = [];
    (D.ganchos || []).forEach(function (g) { if (vistos.indexOf(g[campo]) < 0) vistos.push(g[campo]); });
    return vistos;
  }
  function botonesFiltro(campo, etiquetas) {
    var cont = document.querySelector('.grupo[data-filtro="' + campo + '"]');
    if (!cont) return;
    [''].concat(opciones(campo)).forEach(function (v) {
      var b = el('button', { clase: 'f', type: 'button', 'aria-pressed': v === '' ? 'true' : 'false', texto: v === '' ? 'Todos' : (etiquetas[v] || v) });
      b.addEventListener('click', function () {
        filtros[campo] = v; limite = 12;
        cont.querySelectorAll('.f').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        pintarGanchos();
      });
      cont.append(b);
    });
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function pintarGanchos() {
    var lista = document.getElementById('lista-ganchos');
    if (!lista) return;
    var t = norm(texto);
    var vis = (D.ganchos || []).filter(function (g) {
      return (!filtros.quien || g.quien === filtros.quien) && (!filtros.pilar || g.pilar === filtros.pilar) &&
        (!t || norm(g.texto + ' ' + g.tipo + ' ' + g.porque + ' ' + g.cierre).indexOf(t) >= 0);
    });
    lista.innerHTML = '';
    vis.slice(0, limite).forEach(function (g) {
      var copiar = el('button', { clase: 'copiar', type: 'button', texto: 'Copiar' });
      copiar.addEventListener('click', function () {
        var txt = g.texto + '\n\nCierre: ' + g.cierre;
        var hecho = function () { copiar.textContent = '¡Copiado!'; setTimeout(function () { copiar.textContent = 'Copiar'; }, 1600); };
        var falla = function () { copiar.textContent = 'Selecciona el texto y cópialo'; };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(hecho, falla); else falla();
      });
      lista.append(el('article', { clase: 'tarjeta gancho' }, [
        el('div', { clase: 'top' }, [el('span', { clase: 'tag quien', texto: g.quien }), el('span', { clase: 'tag pilar', texto: ETQ_PILAR[g.pilar] || g.pilar }), el('span', { clase: 'tag', texto: g.tipo })]),
        el('q', { texto: g.texto }),
        el('p', { clase: 'det' }, [el('b', { texto: 'Por qué funciona: ' }), document.createTextNode(g.porque)]),
        el('p', { clase: 'det' }, [el('b', { texto: 'Cierre: ' }), document.createTextNode(g.cierre)]),
        el('div', { clase: 'pie' }, [el('span', { clase: 'fmt', texto: g.formato }), copiar])
      ]));
    });
    if (!vis.length) lista.append(el('p', { clase: 'vacio', texto: 'No hay ganchos con ese filtro. Prueba con «Todos» o con otra palabra.' }));
    document.getElementById('cuenta').textContent = vis.length + (vis.length === 1 ? ' gancho' : ' ganchos');
    var mas = document.getElementById('mas');
    mas.hidden = vis.length <= limite;
  }
  if (document.getElementById('lista-ganchos')) {
    botonesFiltro('quien', { 'texto en pantalla': 'Texto en pantalla' });
    botonesFiltro('pilar', ETQ_PILAR);
    document.getElementById('buscar').addEventListener('input', function () { texto = this.value; limite = 12; pintarGanchos(); });
    document.getElementById('mas').addEventListener('click', function () { limite += 12; pintarGanchos(); });
    pintarGanchos();
  }

  /* ---------- Pestañas (públicos, referentes) ---------- */
  document.querySelectorAll('.pestanas').forEach(function (grupo) {
    var botones = grupo.querySelectorAll('[role="tab"]');
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        botones.forEach(function (x) {
          var on = x === b;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(x.getAttribute('data-p'));
          if (p) p.hidden = !on;
        });
      });
    });
  });

  /* ---------- Reproductor de video (YouTube dentro de la página) ---------- */
  var dlg = document.getElementById('reproductor');
  function abrirVideo(v) {
    if (!v.yt || !dlg || !dlg.showModal) { window.open(v.url, '_blank', 'noopener'); return; }
    document.getElementById('marco-video').innerHTML = '';
    document.getElementById('marco-video').append(el('iframe', {
      src: 'https://www.youtube-nocookie.com/embed/' + v.yt + '?autoplay=1&rel=0', title: v.titulo,
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: ''
    }));
    var pie = document.getElementById('pie-video');
    pie.innerHTML = '';
    pie.append(document.createTextNode(v.titulo + ' · '), el('a', { href: v.url, target: '_blank', rel: 'noopener', texto: 'Abrir en YouTube' }));
    dlg.showModal();
  }
  if (dlg) {
    var cerrar = function () { document.getElementById('marco-video').innerHTML = ''; if (dlg.open) dlg.close(); };
    document.getElementById('cerrar-video').addEventListener('click', cerrar);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrar(); });
    dlg.addEventListener('close', function () { document.getElementById('marco-video').innerHTML = ''; });
  }
  function miniatura(v) {
    var b = el('button', { clase: 'mini', type: 'button', 'aria-label': 'Ver video: ' + v.titulo });
    var img = el('span', { clase: 'img' });
    if (v.yt) img.style.backgroundImage = 'url("https://i.ytimg.com/vi/' + v.yt + '/hqdefault.jpg")';
    b.append(img, el('span', { clase: 'tit', texto: v.titulo }));
    b.addEventListener('click', function () { abrirVideo(v); });
    return b;
  }

  /* ---------- Áreas de marketing ---------- */
  var listaAreas = document.getElementById('lista-areas');
  if (listaAreas) {
    var omitir = /^Ganchos|^Referentes/; // tienen su propia sección
    (D.areas || []).filter(function (a) { return !omitir.test(a.area); }).forEach(function (a, i) {
      var det = el('details', { clase: 'area' });
      if (i === 0) det.open = true;
      var nom = el('span', { clase: 'nom', texto: a.area });
      nom.append(el('span', { clase: 'obj', texto: a.objetivo }));
      det.append(el('summary', {}, [el('span', { clase: 'num', texto: String(i + 1).padStart(2, '0') }), nom, el('span', { clase: 'mas-i', 'aria-hidden': 'true', texto: '+' })]));
      var cont = el('div', { clase: 'tacticas' });
      a.tacticas.forEach(function (t) {
        var ej = el('p', { clase: 'ej' }, [el('b', { texto: 'Ejemplo real: ' }), document.createTextNode(t.ejemplo + ' ')]);
        if (t.url) ej.append(el('a', { href: t.url, target: '_blank', rel: 'noopener', texto: 'Ver fuente ↗' }));
        cont.append(el('div', { clase: 'tactica' }, [el('h4', { texto: t.tactica }), el('p', { texto: t.como }), el('span', { clase: 'kpi', texto: 'Se mide: ' + t.kpi }), ej]));
      });
      det.append(cont);
      listaAreas.append(det);
    });
  }

  /* ---------- Biblioteca de clases de contenido ---------- */
  var listaClases = document.getElementById('lista-clases');
  if (listaClases) {
    var OBJ = { atraer: 'Atraer', conectar: 'Conectar', confianza: 'Dar confianza', convertir: 'Convertir', comunidad: 'Comunidad' };
    var clases = (D.clasesComediantes || []).map(function (c) { return Object.assign({ origen: 'Comediantes' }, c); })
      .concat((D.clasesCoaches || []).map(function (c) { return Object.assign({ origen: 'Coaches' }, c); }));
    var fc = { objetivo: '', origen: '' }, limClases = 6;
    var masClases = el('button', { clase: 'mas', type: 'button', texto: 'Ver más clases de contenido' });
    listaClases.after(masClases);
    masClases.addEventListener('click', function () { limClases += 6; pintarClases(); });
    var pintarClases = function () {
      listaClases.innerHTML = '';
      var visC = clases.filter(function (c) { return (!fc.objetivo || c.objetivo === fc.objetivo) && (!fc.origen || c.origen === fc.origen); });
      masClases.hidden = visC.length <= limClases;
      visC.slice(0, limClases).forEach(function (c) {
        listaClases.append(el('article', { clase: 'tarjeta clase' }, [
          el('div', { clase: 'top' }, [el('span', { clase: 'tag pilar', texto: OBJ[c.objetivo] || c.objetivo }), el('span', { clase: 'tag', texto: c.origen })]),
          el('h3', { clase: 't', texto: c.clase.replace(/^\d+\.\s*/, '') }),
          el('p', { texto: c.descripcion }),
          el('p', {}, [el('b', { texto: 'Quién lo hace: ' }), document.createTextNode(c.ejemplo_referente)]),
          el('p', {}, [el('b', { texto: 'En Atrévete: ' }), document.createTextNode(c.como_aplicarlo_en_atrevete)])
        ]));
      });
    };
    var filtroClases = function (id, campo, valores, etiquetas) {
      var cont = document.getElementById(id);
      [''].concat(valores).forEach(function (v) {
        var b = el('button', { clase: 'f', type: 'button', 'aria-pressed': v === '' ? 'true' : 'false', texto: v === '' ? 'Todas' : (etiquetas[v] || v) });
        b.addEventListener('click', function () {
          fc[campo] = v; limClases = 6;
          cont.querySelectorAll('.f').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          pintarClases();
        });
        cont.append(b);
      });
    };
    filtroClases('filtro-objetivo', 'objetivo', Object.keys(OBJ).filter(function (k) { return clases.some(function (c) { return c.objetivo === k; }); }), OBJ);
    filtroClases('filtro-origen', 'origen', ['Comediantes', 'Coaches'], {});
    pintarClases();
  }

  /* ---------- Referentes ---------- */
  var PAISES = { 'Walter Riso': '' }; // país sin confirmar: no se muestra
  function tarjetaRef(r) {
    var art = el('article', { clase: 'tarjeta ref' }, [el('h3', { texto: r.nombre })]);
    var pais = r.nombre in PAISES ? PAISES[r.nombre] : r.pais;
    if (pais) art.append(el('p', { clase: 'pais', texto: pais }));
    art.append(el('p', { clase: 'perfil', texto: r.perfil }));
    if (r.cuentas && r.cuentas.length) {
      var cu = el('div', { clase: 'cuentas' });
      r.cuentas.forEach(function (c) { cu.append(el('a', { href: c.url, target: '_blank', rel: 'noopener', texto: c.red + (c.seguidores ? ' · ' + c.seguidores.replace(/\s*\(.*\)$/, '') : '') + ' ↗' })); });
      art.append(cu);
    }
    var det = el('details', {}, [el('summary', { texto: 'Lo que le funciona (' + r.funciona.length + ')' })]);
    var ul = el('ul', { clase: 'puntos' });
    r.funciona.forEach(function (f) { ul.append(el('li', { texto: f })); });
    det.append(ul);
    art.append(det, el('p', { clase: 'leccion' }, [el('b', { texto: 'Lección para Atrévete: ' }), document.createTextNode(r.leccion)]));
    if (r.videos && r.videos.length) {
      var mins = el('div', { clase: 'miniaturas' });
      r.videos.forEach(function (v) { mins.append(miniatura(v)); });
      art.append(mins);
    }
    return art;
  }
  function pintarRefs(id, lista) { var c = document.getElementById(id); if (c) (lista || []).forEach(function (r) { c.append(tarjetaRef(r)); }); }
  pintarRefs('lista-com', D.comediantes);
  pintarRefs('lista-coa', D.coaches);
  var casos = (D.areas || []).filter(function (a) { return /^Referentes/.test(a.area); })[0];
  var listaCasos = document.getElementById('lista-casos');
  if (casos && listaCasos) casos.tacticas.forEach(function (t) {
    var art = el('article', { clase: 'tarjeta ref' }, [el('h3', { texto: t.tactica }), el('p', { clase: 'perfil', texto: t.ejemplo })]);
    art.append(el('p', { clase: 'leccion' }, [el('b', { texto: 'Lección para Atrévete: ' }), document.createTextNode(t.como)]));
    var yt = (t.url.match(/(?:v=|youtu\.be\/)([\w-]{11})/) || [])[1];
    if (yt) art.append(el('div', { clase: 'miniaturas' }, [miniatura({ titulo: t.tactica, url: t.url, yt: yt })]));
    else if (t.url) art.append(el('p', { clase: 'm' }, [el('a', { href: t.url, target: '_blank', rel: 'noopener', texto: 'Ver la fuente ↗' })]));
    listaCasos.append(art);
  });

  /* ---------- Principios y ganchos que no van ---------- */
  var lp = document.getElementById('lista-principios');
  if (lp) (D.principios || []).forEach(function (p) { lp.append(el('li', {}, [el('b', { texto: p.principio + '. ' }), document.createTextNode(p.explicacion)])); });
  var le = document.getElementById('lista-evitar');
  if (le) (D.evitar || []).forEach(function (t) { le.append(el('li', { texto: t })); });

  /* ---------- Videos de marketing de eventos ---------- */
  var lv = document.getElementById('lista-videos');
  if (lv) (D.videosEventos || []).forEach(function (v) {
    lv.append(el('article', { clase: 'tarjeta video' }, [miniatura(v), el('p', { texto: v.que }), el('p', {}, [el('b', { texto: 'Para Atrévete: ' }), document.createTextNode(v.porque)])]));
  });

  /* ---------- Calendario ---------- */
  var SEMANAS = [
    { n: 1, f: '20 al 26 oct', fase: 'Arranque', pauta: 10, que: ['El enlace del show en la bio, en Threads y de primero en el Linktree.', 'Reel de anuncio en el que Luis Carlos presenta a Moisés.', 'Estado de WhatsApp y foto de perfil del evento.', 'Primer post con la palabra clave FELIZ.'] },
    { n: 2, f: '27 oct al 2 nov', fase: 'Reír', pauta: 10, que: ['Clips de shows anteriores con la risa del público.', 'Carrusel «Lo que necesitas saber» (fecha, lugar, pago, spam).', 'Primeras pruebas de pauta con 4 a 6 piezas.'] },
    { n: 3, f: '3 al 9 nov', fase: 'Conectar', pauta: 13, que: ['Luis Carlos presenta a Moisés: «Reírse también sana».', 'Hilo en Threads con una pregunta en la que la gente se reconozca.', 'Heridas contadas con humor: Moisés pasa de la risa a la reflexión.'] },
    { n: 4, f: '10 al 16 nov', fase: 'Mostrar', pauta: 13, que: ['Ensayo y detrás de cámaras.', 'Colaboración con 1 a 3 creadores de Barranquilla.', 'Nota o entrevista en prensa local.'] },
    { n: 5, f: '17 al 23 nov', fase: 'Puente', pauta: 14, que: ['El 20 de noviembre, en «Cuando la vida nos mueve», se anuncia Atrévete con un QR en pantalla.', 'Clips de ese evento al día siguiente.'] },
    { n: 6, f: '24 al 30 nov', fase: 'Grupos y regalo', pauta: 20, que: ['«Vente con tu combo»: grupos de amigos y cierre de año de empresas.', '«Regala la risa» para Navidad.', 'Contacto directo con empresas por WhatsApp.'] },
    { n: 7, f: '1 al 10 dic', fase: 'Cuenta regresiva', pauta: 20, que: ['Un reel diario e historias diarias con cuenta regresiva.', 'Recordatorios a quienes compraron: 7 días antes, 1 día antes y el mismo día.', 'El día del show, en vivo desde la puerta.'] }
  ];
  var ls = document.getElementById('lista-semanas'), ds = document.getElementById('detalle-semana');
  if (ls && ds) {
    var elegir = function (s, boton) {
      ls.querySelectorAll('.semana').forEach(function (x) { x.setAttribute('aria-selected', x === boton ? 'true' : 'false'); });
      ds.innerHTML = '';
      var ul = el('ul', { clase: 'puntos' });
      s.que.forEach(function (q) { ul.append(el('li', { texto: q })); });
      var barra = el('div', { clase: 'barra-p' }, [el('i')]);
      barra.firstChild.style.width = s.pauta + '%';
      ds.append(el('h3', { clase: 't', texto: 'Semana ' + s.n + ' · ' + s.fase + ' · ' + s.f }), ul,
        el('p', { clase: 'm', texto: 'Pauta de esta semana: ' + s.pauta + ' % del total (la barra completa es el 100 %)' }), barra);
    };
    SEMANAS.forEach(function (s, i) {
      var b = el('button', { clase: 'semana', role: 'tab', type: 'button', 'aria-selected': 'false' }, [el('span', { clase: 'k', texto: 'Semana ' + s.n }), el('span', { clase: 'fe', texto: s.f }), el('span', { clase: 'fase', texto: s.fase })]);
      b.addEventListener('click', function () { elegir(s, b); });
      ls.append(b);
      if (i === 0) elegir(s, b);
    });
  }

  /* ---------- Simulador de pauta ---------- */
  var TRM = 3170.46;
  var ESC = { cons: { cpm: 7, ctr: 0.008, carga: 0.7, conv: 0.01 }, med: { cpm: 5, ctr: 0.012, carga: 0.8, conv: 0.02 }, opt: { cpm: 3, ctr: 0.018, carga: 0.9, conv: 0.03 } };
  var pesos = function (n) { return '$' + Math.round(n).toLocaleString('es-CO'); };
  var sm = document.getElementById('sim-monto'), sb = document.getElementById('sim-boletas');
  function simular() {
    var cop = Number(sm.value), bpc = Number(sb.value);
    document.getElementById('sim-cop').textContent = pesos(cop);
    document.getElementById('sim-usd').textContent = '≈ USD ' + (cop / TRM).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('sim-bpc').textContent = String(bpc).replace('.', ',');
    var res = {};
    Object.keys(ESC).forEach(function (k) {
      var e = ESC[k], vistas = (cop / TRM) / e.cpm * 1000;
      res[k] = vistas * e.ctr * e.carga * e.conv;
      document.getElementById('r-' + k).textContent = Math.round(res[k] * bpc).toLocaleString('es-CO');
    });
    var porBoleta = cop / Math.max(res.med * bpc, 0.01);
    document.getElementById('r-costo').textContent = 'Escenario medio: ≈ ' + pesos(porBoleta) + ' de pauta por boleta (la meta es menos de $45.000; la boleta vale $90.000). ' +
      (porBoleta > 45000 ? 'Con gente que no conoce a Moisés ni a Konsiente y una boleta por compra no se alcanza la meta: por eso la pauta va primero a quien ya los sigue y se empuja la compra en grupo. Prueba con 2 o 3 boletas por compra.' : 'Con este promedio de boletas por compra, la pauta está dentro de la meta.');
    document.querySelectorAll('.niveles .f').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.getAttribute('data-monto')) === cop ? 'true' : 'false'); });
  }
  if (sm && sb) {
    sm.addEventListener('input', simular); sb.addEventListener('input', simular);
    document.querySelectorAll('.niveles .f').forEach(function (b) { b.addEventListener('click', function () { sm.value = b.getAttribute('data-monto'); simular(); }); });
    simular();
  }

  /* ---------- Lista de lo que debe estar listo ---------- */
  var CHECK = [
    ['Aforo del salón confirmado', 'cli', 'Cliente'],
    ['Fecha de cierre de la preventa y precio después', 'cli', 'Cliente'],
    ['Enlace del show en la bio y de primero en el Linktree', 'amb', 'Ambos'],
    ['Saber de qué canal viene cada venta (enlaces por canal)', 'kv', 'KVRA'],
    ['Medición de anuncios en la página (píxel de Meta)', 'kv', 'KVRA'],
    ['Correos desde info@turquexa.com.co, fuera de spam', 'amb', 'Ambos'],
    ['Términos de venta y política de datos de TURQUEXA', 'cli', 'Cliente'],
    ['Permisos de los clips y para grabar el show', 'cli', 'Cliente'],
    ['Cómo presentamos a Moisés y su show en el tiquete y la página', 'amb', 'Ambos'],
    ['Palabra clave FELIZ y respuesta con el enlace', 'kv', 'KVRA']
  ];
  var lc = document.getElementById('lista-check');
  if (lc) {
    var guardado = {};
    try { guardado = JSON.parse(localStorage.getItem('atrevete-listo') || '{}'); } catch (e) {}
    CHECK.forEach(function (c, i) {
      var caja = el('input', { type: 'checkbox', id: 'chk' + i });
      caja.checked = !!guardado[i];
      var item = el('label', { clase: 'item' + (caja.checked ? ' hecho' : ''), for: 'chk' + i }, [caja, el('span', { clase: 'txt', texto: c[0] }), el('span', { clase: 'quien-t q-' + c[1], texto: c[2] })]);
      caja.addEventListener('change', function () {
        item.classList.toggle('hecho', caja.checked);
        guardado[i] = caja.checked;
        try { localStorage.setItem('atrevete-listo', JSON.stringify(guardado)); } catch (e) {}
      });
      lc.append(item);
    });
  }

  /* ---------- Menú: sección activa y barra de avance ---------- */
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('.menu a'));
  var secciones = enlaces.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  var activoPrevio = null;
  function alDesplazar() {
    var y = window.scrollY + 90, actual = secciones[0];
    secciones.forEach(function (s) { if (s.offsetTop <= y) actual = s; });
    enlaces.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + actual.id;
      a.classList.toggle('activo', on);
      if (on && a !== activoPrevio) {
        var menu = a.parentNode, rm = menu.getBoundingClientRect(), ra = a.getBoundingClientRect();
        menu.scrollLeft += (ra.left - rm.left) - (rm.width - ra.width) / 2;
        activoPrevio = a;
      }
    });
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    document.getElementById('progreso').style.width = (alto > 0 ? (window.scrollY / alto) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
})();
