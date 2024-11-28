import {banco, verificador} from "./firebase/configuracao.js";
import {buscaLivroISBN, buscaLivroTexto} from "./firebase/configLivro.js"; 
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, where, query }
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail}
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

const imgPerfil = document.getElementById("imgPerfil");
const txtNome = document.getElementById("txtNome");
const txtEmail = document.getElementById("txtEmail");
const txtCidade = document.getElementById("txtCidade");
const txtNivel = document.getElementById("txtNivel");
const txtMoedas = document.getElementById("txtMoedas");

let usuario;

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

const abreLivro = (livro) => {
    window.location.href = `perfil_livro_usuario.html?id=${livro}`;
}

const criaLivro = async (livro) => {
    console.log(livro);
    const info = await pesquisaInfo(livro.ISBN);

    return `<div class="content book-button">
          <h3 class="h3-titulo">${info[0]}</h3>
          <p class="p-autor">por ${info[1]}</p>
          <img class="img-livros" src="${livro.foto_obra[0]}">
          <p class="p-card">Estado do Livro: <strong>${livro.estado_obra}</strong></p>
      </div>`;
}

const pesquisaPerfil = async (dono) => {
    const resultado1 = await getDoc(doc(banco, "usuarios", dono));
    const resultado2 = await getDoc(doc(banco, "usuarios", dono, "perfil", "dados"));
    const perfil = [];
    if (resultado1.exists() && resultado2.exists()) {
        perfil.push({...resultado1.data(), ...resultado2.data()});
    } else {
        console.log("Dados não encontrados.");
    }
    return perfil[0];
}

const pesquisaLivros = async (dono) => {
    const resultado = await getDocs(query(collection(banco, "Obra"), where("id_usu", "==", dono)));

    if (resultado.empty) {
        console.log("Sem livros")
        return '';
    } else {
        const livros = [];
        resultado.forEach(doc => {
          livros.push({id_obra: doc.id, ...doc.data()});
        });
        return livros;
    }
}

const pesquisaInfo = async (isbn) => {
    const livro = await buscaLivroISBN(isbn);
    const titulo = livro.titulo;
    const autor = livro.autor
  
    return [titulo, autor];
}


const carregaPag = async () => {
    await verificaUsuario();
    const perfil = await pesquisaPerfil(usuario);

    imgPerfil.src = perfil.foto_usu;
    txtNome.innerHTML = perfil.nome_usu;
    document.getElementById("nomeEdit").value = document.getElementById("txtNome").textContent;
    txtEmail.innerHTML = `<img src="../img/Icones/icone_email.png" alt="Ícone de email">` + perfil.email_usu;
    txtCidade.innerHTML = `<img src="../img/Icones/icone_localizacao.png" alt="Ícone de localização">` + perfil.cidade_usu;
    const cidadeEdit = document.getElementById("cidadeEdit").value = perfil.cidade_usu
    txtMoedas.innerHTML = `<img src="../img/Icones/icone-moeda-perfil.png" alt="Ícone das moedas">` +  "Moedas Disponíveis: " + perfil.moedas_usu;
    txtNivel.innerHTML = "Nivel " + perfil.nivel_usu;

    

    const container = document.getElementById("containerMeusLivros");

    try {
        const livros = await pesquisaLivros(usuario);


        if (livros.length > 0) {
        const cardsLivro = await Promise.all(livros.map(criaLivro));
        container.innerHTML = cardsLivro.join("");
        } else {
        container.innerHTML = "<p>Nenhum livro encontrado.</p>";
        }

        container.querySelectorAll(".book-button").forEach((botao, index) => {
        botao.addEventListener("click", () => abreLivro(livros[index].id_obra));
        });
    } catch (e) {
        console.log(e);
        container.innerHTML = "<p>Erro ao carregar livros. Tente novamente mais tarde.</p>";
    }
}

carregaPag();




document.addEventListener("DOMContentLoaded", function () {
    const btnEditarPerfil = document.getElementById("btn-editar-perfil");
    const containerPerfil = document.getElementById("container-perfil");
    const containerEditar = document.getElementById("container-editar-perfil");
    const containerLivrosCadastrados = document.getElementById("container-livros-cadastrados");
    const containerTrocasRecentes = document.getElementById("container-trocas-recentes");
    const containerCardRecentes = document.getElementById("container-card-recentes");
    const setaVoltar = document.querySelector(".seta-voltar");
    const btnSair = document.getElementById("btn-sair");
    const fundoBorrado = document.querySelector(".fundo-borrado");
    const containerHistorico = document.querySelector(".container-historico");
    const linkHistorico = document.querySelector(".historico-compras");

    // Garantir que o histórico e fundo borrado comecem ocultos
    if (fundoBorrado) {
        fundoBorrado.style.display = "none";
    }
    if (containerHistorico) {
        containerHistorico.style.display = "none";
    }

    // Função para confirmar se o usuário deseja sair da conta
    function confirmarSair(event) {
        event.preventDefault();  

        const confirmar = confirm("Você tem certeza que deseja sair da conta?");
        if (confirmar) {
            alert("Você saiu da conta.");
            signOut(verificador);

            // Redirecionamento ou logout pode ser adicionado aqui
        } else {
            console.log("O usuário decidiu não sair.");
        }
    }

    // Função para exibir o histórico de compras
    function exibirHistorico() {
        if (fundoBorrado) {
            fundoBorrado.style.display = "flex";  // Exibe o fundo borrado
        }
        if (containerHistorico) {
            containerHistorico.style.display = "block";  // Exibe o container de histórico
        }
    }

    // Função para fechar o histórico
    function fecharHistorico() {
        if (fundoBorrado) {
            fundoBorrado.style.display = "none";  // Oculta o fundo borrado
        }
        if (containerHistorico) {
            containerHistorico.style.display = "none";  // Oculta o container de histórico
        }
    }

    // Eventos para o botão editar perfil
    if (btnEditarPerfil && containerPerfil && containerEditar && setaVoltar) {
        console.log("Todos os elementos encontrados no DOM.");

        // Evento para editar perfil
        btnEditarPerfil.addEventListener("click", function (event) {
            event.preventDefault();  

            containerPerfil.style.display = "none";
            if (containerLivrosCadastrados) containerLivrosCadastrados.style.display = "none";
            if (containerTrocasRecentes) containerTrocasRecentes.style.display = "none";
            if (containerCardRecentes) containerCardRecentes.style.display = "none";

            containerEditar.style.display = "block";
        });

        // Evento para voltar ao perfil
        setaVoltar.addEventListener("click", function () {
            const confirmarVoltar = confirm("Você tem certeza que quer voltar? As alterações não serão salvas.");

            if (confirmarVoltar) {
                containerEditar.style.display = "none";
                containerPerfil.style.display = "block";

                if (containerLivrosCadastrados) containerLivrosCadastrados.style.display = "block";
                if (containerTrocasRecentes) containerTrocasRecentes.style.display = "block";
                if (containerCardRecentes) containerCardRecentes.style.display = "block";

                console.log("Os containers foram restaurados ao estado original.");
            } else {
                console.log("O usuário decidiu não voltar.");
            }
        });
    } else {
        console.error("Algum elemento relacionado ao perfil ou cadastro não foi encontrado no DOM.");
    }

    // Evento para sair da conta
    if (btnSair) {
        btnSair.addEventListener("click", confirmarSair);
    } else {
        console.error("Botão 'Sair da Conta' não encontrado no DOM.");
    }

    // Evento para mostrar histórico de compras ao clicar no link
    if (linkHistorico) {
        linkHistorico.addEventListener("click", function (event) {
            event.preventDefault();  // Impede a navegação padrão do link
            exibirHistorico();  // Exibe o histórico
        });
    }

    // Fechar histórico ao clicar no fundo borrado
    if (fundoBorrado) {
        fundoBorrado.addEventListener("click", function (event) {
            if (event.target === fundoBorrado) {
                fecharHistorico();  // Fecha o histórico
            }
        });
    }
});
