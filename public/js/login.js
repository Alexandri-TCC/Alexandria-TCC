import {banco, verificador} from "./firebase/configuracao.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, where, query }
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail}
from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

document.getElementById("formLogin").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email-login").value;
    const senha = document.getElementById("password").value;

    try {
        const usuAut = await signInWithEmailAndPassword(verificador, email, senha);

        if (usuAut.user.emailVerified) {
            window.location.href = "../index.html";
        } else {
            alert("Por favor, verifique seu email antes de acessar.");
        }
    } catch (e) {
        alert("Erro ao realizar login: " + e.message);
    }
});




const existeEmail = async (xEmail) => {
    const Ref = collection(banco, "usuarios");
    console.log(xEmail);
    try {
        const resultado = await getDocs(query(Ref, where("email_usu", "==", xEmail)));
        console.log(resultado);
        if (resultado.empty) {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        return false;
    }
};

document.getElementById("formCadastro").addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email-cadastro").value;
    const senha = document.getElementById("senha").value;
    const Csenha = document.getElementById("confirmar_senha").value;
    const tipo_documento = document.querySelector('input[name="tipo-pessoa"]:checked').value;
    const documento = document.getElementById("documento").value;
    const cidade = document.getElementById("cidade").value;

console.log(tipo_documento + " e " + documento);

    if (senha != Csenha) {
        alert("As senhas não estão correspondentes.");
    } else if (await existeEmail(email) == true) {
        alert("Email indisponível.");
    } else {
        try {
            const usuAut = await createUserWithEmailAndPassword(verificador, email, senha);
            const usuID = usuAut.user.uid;
    
            await setDoc(doc(banco, "usuarios", usuID), {
                nome_usu: nome,
                email_usu: email,
                tipo_usu: tipo_documento,
                documento_usu: documento,
                cidade_usu: cidade
            });
            await setDoc(doc(banco, "usuarios", usuID, "perfil", "dados"), {
                foto_usu: "https://res.cloudinary.com/dwxftry8e/image/upload/v1732596135/Profile_avatar_placeholder_large_mluyfh.png",
                moedas_usu: 0,
                nivel_usu: 1
            });
    
            await sendEmailVerification(verificador.currentUser);
            alert("Cadastro Realizado! Enviamos um link de confirmação ao seu email.");
        } catch (e) {
            alert("Erro ao cadastrar: " + e);
        }
    }
    
});





document.getElementById("formEsquece").addEventListener("submit", async (event) => {
    event.preventDefault()
    const email = document.getElementById("email-redefinir").value;

    try {
        await sendPasswordResetEmail(verificador, email);
        alert("Email de redefinição enviado ao seu Email.");
    } catch (e) {
        alert("Não foi possivel enviar o email: "+ e);
    }
});






document.addEventListener('DOMContentLoaded', () => {
    // Alternar para tela de "Esqueci minha senha"
    const linkEsqueciSenha = document.getElementById('link-esqueci-senha');
    if (linkEsqueciSenha) {
        linkEsqueciSenha.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('.container-login').style.display = 'none';
            document.querySelector('.container-login-esqueci-senha').style.display = 'block';
        });
    }

    // Alternar para tela de "Cadastro"
    const linkCadastrar = document.getElementById('link-cadastrar');
    if (linkCadastrar) {
        linkCadastrar.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('.container-login').style.display = 'none';
            document.querySelector('.container-login-esqueci-senha').style.display = 'none';
            document.querySelector('.container-cadastro').style.display = 'block';
        });
    }

    // Botão "Voltar" na tela de "Esqueci minha senha"
    const btnVoltarEsqueciSenha = document.querySelector('.container-login-esqueci-senha .btn-voltar');
    if (btnVoltarEsqueciSenha) {
        btnVoltarEsqueciSenha.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('.container-login-esqueci-senha').style.display = 'none';
            document.querySelector('.container-login').style.display = 'block';
        });
    }

    // Botão "Voltar" na tela de "Cadastro"
    const btnVoltarCadastro = document.querySelector('.container-cadastro .btn-voltar');
    if (btnVoltarCadastro) {
        btnVoltarCadastro.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('.container-cadastro').style.display = 'none';
            document.querySelector('.container-login').style.display = 'block';
        });
    }

    // Função para alternar entre CPF e CNPJ dependendo do tipo de pessoa
    function togglePessoa() {
        const tipoPessoa = document.querySelector('input[name="tipo-pessoa"]:checked')?.value;
        
        const cpfField = document.getElementById("cpf-fisico");
        const cnpjField = document.getElementById("cnpj-juridico");
    
        if (!cpfField || !cnpjField) {
            console.error('Elementos CPF ou CNPJ não encontrados no DOM.');
            return; // Evita que o restante da função seja executado
        }
    
        if (tipoPessoa === "fisica") {
            cpfField.style.display = "block";
            cpfField.required = true;
            cnpjField.style.display = "none";
            cnpjField.required = false;
            cnpjField.value = "";
        } else if (tipoPessoa === "juridica") {
            cnpjField.style.display = "block";
            cnpjField.required = true;
            cpfField.style.display = "none";
            cpfField.required = false;
            cpfField.value = "";
        } else {
            cpfField.style.display = "none";
            cnpjField.style.display = "none";
            cpfField.required = false;
            cnpjField.required = false;
        }
    }
    
});
