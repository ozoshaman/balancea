import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/")
      .then(res => setMensaje(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Balancea 💰</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;
