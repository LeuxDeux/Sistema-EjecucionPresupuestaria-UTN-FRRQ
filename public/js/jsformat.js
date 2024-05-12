$(document).ready(function() {
    // Función para formatear el número con comas para separar los miles
    function formatNumberWithCommas(number) {
        // Divide el número en grupos de tres dígitos, luego agrega comas entre ellos
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    // Itera sobre todos los elementos con la clase 'monto'
    $('.monto').each(function() {
        var monto = $(this).text(); // Obtén el texto del elemento
        var montoFormateado = formatNumberWithCommas(monto); // Formatea el monto con comas
        $(this).text(montoFormateado); // Establece el texto formateado en el elemento
    });
});