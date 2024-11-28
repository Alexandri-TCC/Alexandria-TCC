import {banco, verificador} from "./firebase/configuracao.js";
import {buscaLivroISBN, buscaLivroTexto} from "./firebase/configLivro.js"; 
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, where, query }
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";



onAuthStateChanged(verificador, (user) => {
    if (user) {
      console.log("Usuário logado:", user.email);
    } else {
      console.log("Nenhum usuário logado");
      window.location.href = "login.html";
    }
  });