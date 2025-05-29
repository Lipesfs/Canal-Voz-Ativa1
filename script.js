document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formMensagem");
    const campo = document.getElementById("mensagem");

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const mensagem = campo.value.trim();

            if (mensagem === "") {
                alert("Por favor, digite uma mensagem.");
                return;
            }

            alert("Mensagem enviada com sucesso!");
            campo.value = "";
        });
    }
});
