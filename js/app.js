(() => {
  let pacientes = Storage.load();
  let seleccionado = null;

  const $ = (id) => document.getElementById(id);
  const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clave = (nombre) => nombre.trim().toLowerCase();
  let respSeleccionado = null;

  // Los responsables se identifican por nombre (sin distinguir mayúsculas); se derivan de las mascotas.
  function responsablesAgrupados() {
    const mapa = new Map();
    pacientes.forEach((p) => p.responsables.forEach((r) => {
      const k = clave(r.nombre);
      if (!mapa.has(k)) mapa.set(k, { clave: k, nombre: r.nombre, telefono: r.telefono, mascotas: [] });
      mapa.get(k).mascotas.push(p);
    }));
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  function filaResponsable(primera) {
    const fila = document.createElement("div");
    fila.className = "resp-row";
    fila.innerHTML = `
      <input type="text" class="r-nombre" list="responsables-sugeridos" maxlength="60" placeholder="Nombre del responsable" aria-label="Nombre del responsable">
      <input type="text" class="r-telefono" maxlength="20" placeholder="Teléfono" aria-label="Teléfono del responsable">
      <button type="button" class="${primera ? "agregar" : "quitar"}" title="${primera ? "Agregar otro responsable" : "Quitar responsable"}"
        aria-label="${primera ? "Agregar otro responsable" : "Quitar responsable"}">${primera ? "+" : "×"}</button>`;
    return fila;
  }

  function reiniciarResponsables() {
    const cont = $("responsables-campos");
    cont.innerHTML = "";
    cont.appendChild(filaResponsable(true));
  }

  $("responsables-campos").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.classList.contains("agregar")) {
      const fila = filaResponsable(false);
      $("responsables-campos").appendChild(fila);
      fila.querySelector(".r-nombre").focus();
    } else {
      btn.closest(".resp-row").remove();
    }
  });

  // Al elegir un responsable existente se completa su teléfono.
  $("responsables-campos").addEventListener("input", (e) => {
    if (!e.target.classList.contains("r-nombre")) return;
    const existente = responsablesAgrupados().find((r) => r.clave === clave(e.target.value));
    const tel = e.target.closest(".resp-row").querySelector(".r-telefono");
    if (existente && !tel.value) tel.value = existente.telefono;
  });

  function renderSugeridos() {
    $("responsables-sugeridos").innerHTML = responsablesAgrupados()
      .map((r) => `<option value="${escapar(r.nombre)}"></option>`).join("");
  }

  function renderResponsables() {
    const ul = $("lista-responsables");
    const grupos = responsablesAgrupados();
    ul.innerHTML = grupos.map((r) => `
      <li tabindex="0" data-resp="${escapar(r.clave)}" class="${r.clave === respSeleccionado ? "selected" : ""}">
        <strong>${escapar(r.nombre)}</strong>
        <small>${r.mascotas.length} mascota(s)</small>
      </li>`).join("") || '<li class="empty">No hay responsables registrados.</li>';

    const det = $("detalle-responsable");
    const r = grupos.find((x) => x.clave === respSeleccionado);
    det.innerHTML = r ? `
      <h3>${escapar(r.nombre)}</h3>
      <p>Teléfono: ${escapar(r.telefono)}</p>
      <p><strong>Mascotas (${r.mascotas.length}):</strong></p>
      ${r.mascotas.map((m) => `<button type="button" class="link pet-chip" data-pet="${m.id}">${escapar(m.nombre)} (${escapar(m.especie)})</button>`).join("")}`
      : '<p class="empty">Seleccione un responsable para ver sus mascotas.</p>';
  }

  function escapar(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  function formatoFecha(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function fechaHaceDias(dias) {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() - dias);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
  }

  function visitasRecientes() {
    const limite = fechaHaceDias(29);
    const limiteSuperior = hoy();
    return pacientes.flatMap((p) => p.visitas
      .filter((v) => v.fecha >= limite && v.fecha <= limiteSuperior)
      .map((v) => ({ paciente: p, visita: v })))
      .sort((a, b) => b.visita.fecha.localeCompare(a.visita.fecha));
  }

  function renderVisitasRecientes() {
    const recientes = visitasRecientes();
    $("rango-visitas").textContent = `Del ${formatoFecha(fechaHaceDias(29))} al ${formatoFecha(hoy())}`;
    $("visitas-recientes").innerHTML = recientes.map(({ paciente, visita }) => `
      <tr>
        <td>${escapar(paciente.nombre)}</td>
        <td>${paciente.responsables.map((r) => escapar(r.nombre)).join(", ")}</td>
        <td>${formatoFecha(visita.fecha)}</td>
        <td>${escapar(visita.motivo)}</td>
      </tr>`).join("");
    $("sin-visitas-recientes").hidden = recientes.length > 0;
  }

  function csvValor(valor) {
    return `"${String(valor).replace(/"/g, '""')}"`;
  }

  function exportarVisitas() {
    const filas = visitasRecientes().flatMap(({ paciente, visita }) =>
      paciente.responsables.map((responsable) => [
        paciente.nombre, responsable.nombre, visita.fecha, visita.motivo
      ]));
    if (!filas.length) {
      mensaje($("msg-exportacion"), "No hay visitas recientes para exportar.", "error");
      return;
    }
    const csv = [
      ["Mascota", "Responsable", "Fecha", "Motivo"],
      ...filas
    ].map((fila) => fila.map(csvValor).join(",")).join("\r\n");
    const enlace = document.createElement("a");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    enlace.href = url;
    enlace.download = "visitas-ultimos-30-dias.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    mensaje($("msg-exportacion"), `${filas.length} fila(s) exportada(s).`, "ok");
  }

  function mensaje(el, texto, tipo) {
    el.textContent = texto;
    el.className = "msg " + tipo;
  }

  function validar(campos) {
    let primero = null;
    campos.forEach(([el, ok]) => {
      el.classList.toggle("invalid", !ok);
      if (!ok && !primero) primero = el;
    });
    if (primero) primero.focus();
    return !primero;
  }

  function limpiarInvalidos(form) {
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  }

  

  function renderSelectVisita() {
    const sel = $("v-paciente");
    const actual = sel.value;
    sel.innerHTML = '<option value="">Seleccione...</option>' +
      pacientes.map((p) => `<option value="${p.id}">${escapar(p.nombre)} (${escapar(p.especie)})</option>`).join("");
    sel.value = pacientes.some((p) => p.id === actual) ? actual : (seleccionado || "");
    actualizarMinFecha();
  }

  function renderLista() {
    const q = $("buscar").value.trim().toLowerCase();
    const lista = pacientes.filter((p) =>
      p.nombre.toLowerCase().includes(q) || p.responsables.some((r) => r.nombre.toLowerCase().includes(q)));
    const ul = $("lista-pacientes");
    if (!lista.length) {
      ul.innerHTML = '<li class="empty">No hay pacientes que coincidan.</li>';
      return;
    }
    ul.innerHTML = lista.map((p) => `
      <li tabindex="0" data-id="${p.id}" class="${p.id === seleccionado ? "selected" : ""}">
        <strong>${escapar(p.nombre)}</strong> · ${escapar(p.especie)}
        <small>Responsables: ${p.responsables.map((r) => escapar(r.nombre)).join(", ")} · ${p.visitas.length} visita(s)</small>
      </li>`).join("");
  }

  function renderDetalle() {
    const cont = $("detalle-contenido");
    const p = pacientes.find((x) => x.id === seleccionado);
    if (!p) {
      cont.innerHTML = '<p class="empty">Seleccione un paciente de la lista para ver su información y visitas.</p>';
      return;
    }
    const visitas = [...p.visitas].sort((a, b) => b.fecha.localeCompare(a.fecha));
    cont.innerHTML = `
      <dl class="info">
        <dt>Nombre</dt><dd>${escapar(p.nombre)}</dd>
        <dt>Especie</dt><dd>${escapar(p.especie)}</dd>
        <dt>Raza</dt><dd>${escapar(p.raza)}</dd>
        <dt>Sexo</dt><dd>${escapar(p.sexo)}</dd>
        <dt>Nacimiento</dt><dd>${formatoFecha(p.nacimiento)}</dd>
        <dt>Responsables</dt><dd>${p.responsables.map((r) => `<button type="button" class="link" data-resp="${escapar(clave(r.nombre))}">${escapar(r.nombre)}</button> (${escapar(r.telefono)})`).join("<br>")}</dd>
      </dl>
      <h3>Historial de visitas (${visitas.length})</h3>
      ${visitas.length ? visitas.map((v) => `
        <div class="visit">
          <strong>${formatoFecha(v.fecha)} — ${escapar(v.motivo)}</strong>
          <p>${escapar(v.observaciones)}</p>
        </div>`).join("") : '<p class="empty">Este paciente aún no tiene visitas registradas.</p>'}`;
  }

  function renderTodo() {
    renderSelectVisita();
    renderLista();
    renderDetalle();
    renderSugeridos();
    renderResponsables();
    renderVisitasRecientes();
  }

  function seleccionar(id) {
    seleccionado = id;
    $("v-paciente").value = id;
    actualizarMinFecha();
    renderLista();
    renderDetalle();
  }

  function seleccionarResponsable(k) {
    respSeleccionado = k;
    renderResponsables();
  }

  $("lista-responsables").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-resp]");
    if (li) seleccionarResponsable(li.dataset.resp);
  });
  $("lista-responsables").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-resp]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); seleccionarResponsable(li.dataset.resp); }
  });
  $("detalle-contenido").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-resp]");
    if (b) seleccionarResponsable(b.dataset.resp);
  });
  $("detalle-responsable").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pet]");
    if (b) seleccionar(b.dataset.pet);
  });

  $("lista-pacientes").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) seleccionar(li.dataset.id);
  });
  $("lista-pacientes").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); seleccionar(li.dataset.id); }
  });
  $("buscar").addEventListener("input", renderLista);
  $("exportar-visitas").addEventListener("click", exportarVisitas);

  $("form-paciente").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = {
      nombre: $("p-nombre"), especie: $("p-especie"), raza: $("p-raza"), nacimiento: $("p-nacimiento"),
      sexo: $("p-sexo")
    };
    const v = (k) => f[k].value.trim();
    const filas = [...document.querySelectorAll("#responsables-campos .resp-row")].map((fila) => ({
      fila, nombre: fila.querySelector(".r-nombre"), telefono: fila.querySelector(".r-telefono")
    }));
    // Un responsable no puede repetirse en la misma mascota.
    const vistos = new Set();
    let duplicado = false;
    const chequeos = filas.flatMap((r) => {
      const k = clave(r.nombre.value);
      const repetido = k.length >= 3 && vistos.has(k);
      vistos.add(k);
      duplicado = duplicado || repetido;
      return [
        [r.nombre, r.nombre.value.trim().length >= 3 && !repetido],
        [r.telefono, /^[0-9+\-\s()]{7,20}$/.test(r.telefono.value.trim())]
      ];
    });
    const ok = validar([
      [f.nombre, v("nombre").length >= 2],
      [f.especie, v("especie") !== ""],
      [f.raza, v("raza") !== ""],
      [f.nacimiento, v("nacimiento") !== "" && v("nacimiento") <= hoy()],
      [f.sexo, v("sexo") !== ""],
      ...chequeos
    ]);
    const msg = $("msg-paciente");
    if (!ok) {
      mensaje(msg, duplicado
        ? "Un mismo responsable no puede agregarse dos veces a la mascota."
        : "Complete todos los campos correctamente (fecha no futura, responsables con nombre y teléfono de 7+ dígitos).", "error");
      return;
    }
    const nuevo = { id: uid("p"), visitas: [] };
    Object.keys(f).forEach((k) => (nuevo[k] = v(k)));
    nuevo.responsables = filas.map((r) => ({ nombre: r.nombre.value.trim(), telefono: r.telefono.value.trim() }));
    pacientes.push(nuevo);
    Storage.save(pacientes);
    seleccionado = nuevo.id;
    e.target.reset();
    limpiarInvalidos(e.target);
    reiniciarResponsables();
    renderTodo();
    mensaje(msg, `Paciente "${nuevo.nombre}" registrado.`, "ok");
  });

  $("form-visita").addEventListener("submit", (e) => {
    e.preventDefault();
    const sel = $("v-paciente"), fecha = $("v-fecha"), motivo = $("v-motivo"), obs = $("v-observaciones");
    const p = pacientes.find((x) => x.id === sel.value);
    const fechaValida = fecha.value !== "" && (!p || fecha.value >= p.nacimiento);
    const ok = validar([
      [sel, sel.value !== ""],
      [fecha, fechaValida],
      [motivo, motivo.value.trim().length >= 3],
      [obs, obs.value.trim().length >= 3]
    ]);
    const msg = $("msg-visita");
    if (!ok) {
      const antesDeNacer = p && fecha.value !== "" && !fechaValida;
      mensaje(msg, antesDeNacer
        ? `La fecha de la visita no puede ser anterior al nacimiento de ${p.nombre} (${formatoFecha(p.nacimiento)}).`
        : "Seleccione un paciente y complete fecha, motivo y observaciones.", "error");
      return;
    }
    p.visitas.push({ id: uid("v"), fecha: fecha.value, motivo: motivo.value.trim(), observaciones: obs.value.trim() });
    Storage.save(pacientes);
    seleccionado = p.id;
    e.target.reset();
    limpiarInvalidos(e.target);
    fecha.value = hoy();
    renderTodo();
    mensaje(msg, `Visita registrada para ${p.nombre}.`, "ok");
  });

  // El selector de fecha impide elegir días previos al nacimiento del paciente.
  function actualizarMinFecha() {
    const p = pacientes.find((x) => x.id === $("v-paciente").value);
    $("v-fecha").min = p ? p.nacimiento : "";
  }
  $("v-paciente").addEventListener("change", actualizarMinFecha);

  $("v-fecha").value = hoy();
  $("p-nacimiento").max = hoy();
  reiniciarResponsables();
  renderTodo();
})();
