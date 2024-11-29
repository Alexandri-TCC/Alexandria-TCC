import {banco, verificador} from "./firebase/configuracao.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, getDoc, where, query, updateDoc, serverTimestamp, onSnapshot, orderBy }
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import {onAuthStateChanged, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail}
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

let usuario;
let destinoInit;

const verificaUsuario = async () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(verificador, (user) => {
      if (user) {
        console.log("Usuário logado:", user.email);
        usuario = user.uid;
        resolve(usuario);
      } else {
        console.log("Nenhum usuário logado");
        window.location.href = "login.html";
        reject("Usuário não logado");
      }
    });
  });
};


const listaConversa = document.getElementById("listaConversa");

const conversaFechada = document.getElementById("conversation-0");
const conversaAberta = document.getElementById("conversation-1");

const infoNome = document.getElementById("infoNome");
const infoCidade = document.getElementById("infoCidade");
const infoImg = document.getElementById("infoImg");
const infoMoedas = document.getElementById("infoMoedas");
const txtUsuario = document.getElementById("txtUsuario");
const imgUsuario = document.getElementById("imgUsuario");
const imgDestinatario = document.getElementById("imgDestinatario");

const enviaForm = document.getElementById("enviaForm");
const txtMensagem = document.getElementById("txtMensagem");
const btnEnvia = document.getElementById("btnEnvia");


const infoDestinatario = async (destinatario) => {
  infoNome.innerHTML = "<strong>Nome: </strong>" + " Carregando...";
  infoCidade.innerHTML = "<strong>Localização: </strong>" + " Carregando...";
  txtUsuario.innerHTML = " Carregando...";
  infoImg.src = 'https://res.cloudinary.com/dwxftry8e/image/upload/v1732596135/Profile_avatar_placeholder_large_mluyfh.png';
  imgDestinatario.src = 'https://res.cloudinary.com/dwxftry8e/image/upload/v1732596135/Profile_avatar_placeholder_large_mluyfh.png';

  const resultado = await getDoc(doc(banco, "usuarios", destinatario));
  const resultado2 = await getDoc(doc(banco, "usuarios", destinatario, "perfil", "dados"));

  infoNome.innerHTML = "<strong>Nome: </strong>" + " " + resultado.data().nome_usu;
  infoCidade.innerHTML = "<strong>Localização: </strong>" + " " + resultado.data().cidade_usu;
  txtUsuario.innerHTML = resultado.data().nome_usu;
  infoImg.src = resultado2.data().foto_usu;
  imgDestinatario.src = resultado2.data().foto_usu;
}

const infoUsuario = async (usu) => {
  const resultado = await getDoc(doc(banco, "usuarios", usu, "perfil", "dados"));
  imgUsuario.src = resultado.data().foto_usu;
  infoMoedas.setAttribute('data-title', (resultado.data().moedas_usu + " Moedas"))
}



const pesquisaInfo = async (usu) => {
  const resultado = await getDoc(doc(banco, "usuarios", usu));
  const resultado2 = await getDoc(doc(banco, "usuarios", usu, "perfil", "dados"));
  const nome = resultado.data().nome_usu;
  const imagem = resultado2.data().foto_usu;

  return [imagem, nome];
} 

const carregaChat = async (chat) => {
  const infoExtra = await pesquisaInfo(chat.id_remetente);
  
  const minutos = chat.ultimo_horario.toDate().getMinutes();
  const hora = (chat.ultimo_horario.toDate().getHours() + ":" + String(minutos).padStart(2, '0'));
  
  return `
  <li class="displayConversa">
          <a href="#" data-conversation="#conversation-1">
              <img class="content-message-image"
                  src="${infoExtra[0]}"
                  alt="">
              <span class="content-message-info">
                  <span class="content-message-name">${infoExtra[1]}</span>
                  <span class="content-message-text">${chat.ultima_msg}</span>
              </span>
              <span class="content-message-more">
                  <span class="content-message-time">${hora}</span>
              </span>
          </a>
      </li>
  `
}


const pesquisaChat = async (usu) => {
  try {
    const resultado = await getDocs(query(collection(banco, "conversas"), where("participantes", "array-contains", usu), orderBy('ultimo_horario', 'desc')));

      const chats = [];
      resultado.docs.forEach(doc => {
      
        console.log(usu)
        var nomePesquisa;
          if (doc.data().participantes[0] == usu) {
            nomePesquisa = doc.data().participantes[1];
          } else {
            nomePesquisa = doc.data().participantes[0];
          }

        chats.push({id_conversa: doc.id, id_remetente: nomePesquisa, ...doc.data()});
      });
      return chats;

  } catch (error) {
      console.error("Erro ao buscar chats: ", error);
      return [];
  }
}

const abreChat = async (conversa, remetente) => {
  destinoInit = remetente;
  conversaFechada.classList.remove('active');
  conversaAberta.classList.add('active');
  infoDestinatario(remetente);
  carregarMensagens(conversa);
}

const listaChats = async () => {
  listaConversa.innerHTML = "";

  try {
    const chats = await pesquisaChat(usuario);

    console.log(chats);
    if (chats.length > 0) {
      const cardsChat = await Promise.all(chats.map(carregaChat));
      
      listaConversa.innerHTML = cardsChat.join("");
    } else {
      listaConversa.innerHTML = "<p>Nenhum chat encontrado.</p>";
    }

    listaConversa.querySelectorAll(".displayConversa").forEach((botao, index) => {
      const conversa = chats[index].id_conversa;
      const remetente = chats[index].id_remetente;

      botao.addEventListener("click", () => abreChat(conversa, remetente));
    });
  } catch (e) {
    console.log("erro: " + e)
  }

}

const pegaDestino = async() => {
  const urlPesquisa = new URLSearchParams(window.location.search);
  if (!urlPesquisa.get("init")) {
    
  } else {
    conversaFechada.classList.remove('active');
    conversaAberta.classList.add('active');
    infoDestinatario(urlPesquisa.get("init"));
    const participantes = [usuario, urlPesquisa.get("init")].sort();
    const resultado = await getDocs(query(collection(banco, "conversas"), where("participantes", "==", participantes)));
    if (!resultado.empty) {
      carregarMensagens(resultado.docs[0].id);
    }
    return urlPesquisa.get("init");
  }
}





const enviarMensagem = async (idRemetente, idDestinatario, textoMensagem) => {
  const participantes = [idRemetente, idDestinatario].sort();

  const resultado = await getDocs(query(collection(banco, "conversas"), where("participantes", "==", participantes)));

  let conversaId;

  if (resultado.empty) {
      const novaConversa = await addDoc(collection(banco, "conversas"), {
          participantes: participantes,
          ultima_msg: textoMensagem,
          ultimo_horario: serverTimestamp(),
      });
      conversaId = novaConversa.id;
  } else {
      const conversaDoc = resultado.docs[0];
      conversaId = conversaDoc.id;

      await updateDoc(doc(banco, "conversas", conversaId), {
          ultima_msg: textoMensagem,
          ultimo_horario: serverTimestamp(),
      });
  }

  const mensagensRef = collection(banco, "conversas", conversaId, "mensagens");
  await addDoc(mensagensRef, {
      id_remetente: idRemetente,
      texto_msg: textoMensagem,
      horario_msg: serverTimestamp(),
  });

  listaChats();
  carregarMensagens(conversaId);
  console.log("Mensagem enviada com sucesso!");
}



async function carregarMensagens(conversaId) {
    const mensagensQuery = query(collection(doc(banco, "conversas", conversaId), 'mensagens'), orderBy('horario_msg'));

    onSnapshot(mensagensQuery, (snapshot) => {
        const chatBox = document.querySelector('.conversation-wrapper');
        chatBox.innerHTML = '';
        
        snapshot.forEach(doc => {
            const mensagem = doc.data();
            
            const classe = mensagem.id_remetente === usuario ? 'other' : 'me';
            var fotoUsu = '';
            console.log(imgUsuario.src + " e " + imgDestinatario.src)
            if (classe == 'other') {
              fotoUsu = imgUsuario.src;
            } else {
              fotoUsu = imgDestinatario.src;
            }

            chatBox.innerHTML += `
                <li class="conversation-item ${classe}">
                    <div class="conversation-item-side">
                        <img class="conversation-item-image" src="${fotoUsu}" alt="User Image">
                    </div>
                    <div class="conversation-item-content">
                        <div class="conversation-item-wrapper">
                            <div class="conversation-item-box">
                                <div class="conversation-item-text">
                                    <p>${mensagem.texto_msg}</p>
                                    <div class="conversation-item-time">${new Date(mensagem.horario_msg?.toDate()).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>`;
        });
    });
}









document.addEventListener('DOMContentLoaded', function () {

  // Verifica se o botão de perfil existe e adiciona o listener
  const profileToggle = document.querySelector('.chat-sidebar-profile-toggle');
  if (profileToggle) {
    profileToggle.addEventListener('click', function (e) {
      e.preventDefault();
      const parentElement = this.parentElement;
      if (parentElement) {
        parentElement.classList.toggle('active');
      }
    });
  }

  // Verifica se o clique fora do perfil deve fechar o menu
  document.addEventListener('click', function (e) {
    const sidebarProfile = document.querySelector('.chat-sidebar-profile');
    if (sidebarProfile && !e.target.closest('.chat-sidebar-profile')) {
      sidebarProfile.classList.remove('active');
    }
  });

  // Verifica os dropdowns de conversa
  document.querySelectorAll('.conversation-item-dropdown-toggle').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const parentDropdown = this.parentElement;
      document.querySelectorAll('.conversation-item-dropdown').forEach(function (dropdown) {
        dropdown.classList.remove('active');
      });
      parentDropdown.classList.toggle('active');
    });
  });

  // Verifica se os cliques fora de dropdowns de conversa devem fechar os menus
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.conversation-item-dropdown')) {
      document.querySelectorAll('.conversation-item-dropdown').forEach(function (dropdown) {
        dropdown.classList.remove('active');
      });
    }
  });

  // Ajusta a altura do input de conversa automaticamente com base nas linhas
  document.querySelectorAll('.conversation-form-input').forEach(function (item) {
    item.addEventListener('input', function () {
      this.rows = this.value.split('\n').length;
    });
  });

  // Lida com o clique nas conversas
  document.querySelectorAll('[data-conversation]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.conversation').forEach(function (conversation) {
        conversation.classList.remove('active');
      });
      document.querySelector(this.dataset.conversation).classList.add('active');
    });
  });

  // Lida com o clique para voltar nas conversas
  document.querySelectorAll('.conversation-back').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      this.closest('.conversation').classList.remove('active');
      document.querySelector('.conversation-default').classList.add('active');
    });
  });


  function closeUserDetails() {
    const modal = document.getElementById('userModal');
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Fechar modal ao clicar fora dele
  window.onclick = function (event) {
    const modal = document.getElementById('userModal');
    if (modal && event.target === modal) {
      closeUserDetails();
    }

    // Fechar o menu caso não tenha clicado no botão de menu
    const menuDropdown = document.getElementById("menuDropdown");
    if (menuDropdown && !event.target.closest('.menu-button')) {
      if (menuDropdown.classList.contains('show')) {
        menuDropdown.classList.remove('show');
      }
    }
  };

  // Adicionando foco ao campo de input ao abrir o modal
  const myModal = document.getElementById('myModal');
  const myInput = document.getElementById('myInput');
  if (myModal && myInput) {
    myModal.addEventListener('shown.bs.modal', () => {
      myInput.focus();
    });
  }

});

document.getElementById("btnInfo").addEventListener("click", async () => {
  alert("⚠️ Atenção: Não divulgue informações pessoais na internet.\n\n" +
    "Consequências podem incluir roubo de identidade, golpes financeiros " +
    "e comprometimento da sua segurança. Proteja-se!");
});



await verificaUsuario();
listaChats();

destinoInit = await pegaDestino();
infoUsuario(usuario);




enviaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  btnEnvia.disabled = true;
  enviarMensagem(usuario, destinoInit, txtMensagem.value);
  txtMensagem.value = '';
  btnEnvia.disabled = false;
}) // */

document.getElementById("btnSair").addEventListener("click", async (event) => {
  event.preventDefault();
  const sair = confirm("Você tem certeza que deseja sair da conta?");
  if (sair) {
    alert("Você saiu da conta.");
    signOut(verificador);
  }  
})