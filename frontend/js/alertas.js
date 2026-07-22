const SWAL_COLOR_CONFIRMAR = "#6d3fd6";
const SWAL_COLOR_CANCELAR = "#6b6a74";
const SWAL_COLOR_PELIGRO = "#e2502e";

function alertaCargando(mensaje = "Cargando...") {
  Swal.fire({
    title: mensaje,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    customClass: { popup: "swal-riwi" },
    didOpen: () => Swal.showLoading(),
  });
}

function alertaExito(mensaje, titulo = "Listo") {
  return Swal.fire({
    icon: "success",
    title: titulo,
    text: mensaje,
    confirmButtonColor: SWAL_COLOR_CONFIRMAR,
    customClass: { popup: "swal-riwi" },
    timer: 1600,
    showConfirmButton: false,
  });
}

function alertaError(mensaje, titulo = "Ups, algo salió mal") {
  return Swal.fire({
    icon: "error",
    title: titulo,
    text: mensaje,
    confirmButtonColor: SWAL_COLOR_CONFIRMAR,
    customClass: { popup: "swal-riwi" },
  });
}

async function alertaConfirmar(mensaje, titulo = "¿Estás seguro?", peligroso = false) {
  const resultado = await Swal.fire({
    icon: "question",
    title: titulo,
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: peligroso ? SWAL_COLOR_PELIGRO : SWAL_COLOR_CONFIRMAR,
    cancelButtonColor: SWAL_COLOR_CANCELAR,
    customClass: { popup: "swal-riwi" },
  });
  return resultado.isConfirmed;
}

async function alertaInput(titulo, placeholder = "") {
  const resultado = await Swal.fire({
    title: titulo,
    input: "textarea",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Enviar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: SWAL_COLOR_CONFIRMAR,
    cancelButtonColor: SWAL_COLOR_CANCELAR,
    customClass: { popup: "swal-riwi" },
    inputValidator: (value) => (!value ? "Este campo es obligatorio" : undefined),
  });
  return resultado.isConfirmed ? resultado.value : null;
}

function toastExito(mensaje) {
  Swal.fire({
    icon: "success",
    title: mensaje,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    customClass: { popup: "swal-riwi" },
  });
}

function alertaToast(mensaje, tipo = "info") {
  Swal.fire({
    icon: tipo,
    title: mensaje,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    customClass: { popup: "swal-riwi" },
  });
}
