function status(_request, response) {
  response.status(200).json({ message: "Olá, mundo!" });
}

export default status;
