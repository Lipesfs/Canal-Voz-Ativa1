document.getElementById('messageForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const message = document.getElementById('message').value;

  if (category && message) {
    alert('Mensagem enviada! Sua mensagem foi recebida com sucesso e será analisada pela nossa equipe.');
    this.reset();
  } else {
    alert('Preencha todos os campos.');
  }
});
