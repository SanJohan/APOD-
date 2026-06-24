const API_KEY = "84KS51tmx78Zt8ANDh7Uupqd5rMwEab9hb8O9WUV";
const API_URL = "https://api.nasa.gov/planetary/apod";

const fechaInput = document.getElementById("fecha");
const btnBuscar = document.getElementById("btnBuscar");
const btnFavorito = document.getElementById("btnFavorito");

const mensaje = document.getElementById("mensaje");
const apodContainer = document.getElementById("apodContainer");
const titulo = document.getElementById("titulo");
const fechaApod = document.getElementById("fechaApod");
const mediaContainer = document.getElementById("mediaContainer");
const explicacion = document.getElementById("explicacion");
const listaFavoritos = document.getElementById("listaFavoritos");

let apodActual = null;

document.addEventListener("DOMContentLoaded", () => {
  configurarFechaMaxima();
  obtenerApodDelDia();
  mostrarFavoritos();
});

btnBuscar.addEventListener("click", () => {
  const fecha = fechaInput.value;

  if (!fecha) {
    mostrarMensaje("Debes seleccionar una fecha.", "warning");
    return;
  }

  if (esFechaFutura(fecha)) {
    mostrarMensaje("No se permiten fechas futuras.", "danger");
    return;
  }

  obtenerApodPorFecha(fecha);
});

btnFavorito.addEventListener("click", guardarFavorito);

function configurarFechaMaxima() {
  fechaInput.max = obtenerFechaActual();
}

function obtenerFechaActual() {
  return new Date().toISOString().split("T")[0];
}

function esFechaFutura(fecha) {
  return fecha > obtenerFechaActual();
}

async function obtenerApodDelDia() {
  try {
    mostrarMensaje("Cargando APOD del día...", "info");

    const respuesta = await fetch(`${API_URL}?api_key=${API_KEY}`);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: no se pudo cargar la APOD`);
    }

    const data = await respuesta.json();

    console.log("APOD del día:", data);

    apodActual = data;
    mostrarApod(data);
    ocultarMensaje();
  } catch (error) {
    console.error(error);

    mostrarMensaje(
      "La API de NASA no está disponible ahora. Prueba buscar una fecha manualmente o usa una API KEY propia.",
      "danger",
    );
  }
}

async function obtenerApodPorFecha(fecha) {
  try {
    mostrarMensaje("Buscando APOD...", "info");

    const respuesta = await fetch(
      `${API_URL}?api_key=${API_KEY}&date=${fecha}`,
    );

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: no se pudo buscar la APOD`);
    }

    const data = await respuesta.json();

    console.log("APOD por fecha:", data);

    apodActual = data;
    mostrarApod(data);
    ocultarMensaje();
  } catch (error) {
    console.error(error);

    mostrarMensaje(
      "No se pudo buscar la APOD de esa fecha. Intenta con otra fecha.",
      "danger",
    );
  }
}

function mostrarApod(apod) {
  console.log("Mostrando APOD:", apod);

  apodContainer.classList.remove("d-none");

  titulo.textContent = apod.title;
  fechaApod.textContent = `Fecha: ${apod.date}`;
  explicacion.textContent = apod.explanation;

  mediaContainer.innerHTML = "";

  if (apod.media_type === "image") {
    const imagen = document.createElement("img");
    imagen.src = apod.url;
    imagen.alt = apod.title;
    imagen.classList.add("img-fluid");

    mediaContainer.appendChild(imagen);
  } else if (apod.media_type === "video") {
    if (
      apod.url.includes("youtube.com") ||
      apod.url.includes("youtu.be") ||
      apod.url.includes("vimeo.com")
    ) {
      const video = document.createElement("iframe");
      video.src = apod.url;
      video.allowFullscreen = true;
      video.width = "100%";
      video.height = "450";

      mediaContainer.appendChild(video);
    } else {
      mediaContainer.innerHTML = `
        <div class="alert alert-info">
          Este video no se puede mostrar dentro de la página.
          <br><br>
          <a href="${apod.url}" target="_blank" class="btn btn-primary">
            Abrir contenido
          </a>
        </div>
      `;
    }
  } else {
    mediaContainer.innerHTML = `
      <div class="alert alert-warning">
        Este tipo de contenido no se puede mostrar.
      </div>
    `;
  }
}

function guardarFavorito() {
  if (!apodActual) {
    mostrarMensaje("No hay una APOD cargada para guardar.", "warning");
    return;
  }

  const favoritos = obtenerFavoritos();

  const existe = favoritos.some((item) => item.date === apodActual.date);

  if (existe) {
    mostrarMensaje("Esta APOD ya está guardada en favoritos.", "warning");
    return;
  }

  const favorito = {
    title: apodActual.title,
    date: apodActual.date,
    media_type: apodActual.media_type,
    url: apodActual.url,
    explanation: apodActual.explanation,
  };

  favoritos.push(favorito);

  localStorage.setItem("favoritosAPOD", JSON.stringify(favoritos));

  mostrarFavoritos();
  mostrarMensaje("APOD guardada en favoritos.", "success");
}

function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem("favoritosAPOD")) || [];
}

function mostrarFavoritos() {
  const favoritos = obtenerFavoritos();

  listaFavoritos.innerHTML = "";

  if (favoritos.length === 0) {
    listaFavoritos.innerHTML = `
      <li class="list-group-item text-muted">
        No hay favoritos guardados.
      </li>
    `;
    return;
  }

  favoritos.forEach((favorito) => {
    const li = document.createElement("li");

    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
    );

    li.innerHTML = `
      <span>
        <strong>${favorito.title}</strong><br>
        <small>${favorito.date}</small>
      </span>
      <button class="btn btn-sm btn-danger">Eliminar</button>
    `;

    li.addEventListener("click", () => {
      apodActual = favorito;
      mostrarApod(favorito);
      ocultarMensaje();
    });

    const btnEliminar = li.querySelector("button");

    btnEliminar.addEventListener("click", (event) => {
      event.stopPropagation();
      eliminarFavorito(favorito.date);
    });

    listaFavoritos.appendChild(li);
  });
}

function eliminarFavorito(fecha) {
  let favoritos = obtenerFavoritos();

  favoritos = favoritos.filter((item) => item.date !== fecha);

  localStorage.setItem("favoritosAPOD", JSON.stringify(favoritos));

  mostrarFavoritos();
  mostrarMensaje("Favorito eliminado.", "success");
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
}

function ocultarMensaje() {
  mensaje.className = "alert d-none";
}
