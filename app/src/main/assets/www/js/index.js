var atendimentos = {}
var suprimentos = {}
var clientes = {}

const gravarToken = token => {
    var usuario = JSON.parse(Android.pegarUsuario())
    if(usuario != null) {
        axios.get('https://us-central1-ioi-printers.cloudfunctions.net/gravarToken?token=' + token + '&id=' + usuario.id).then(res => {
            messages('Token gravado com sucesso!')
        }).catch(err => {
            console.error(" erro ao gravar token ", err)
            error('Erro ao gravar Token!')
        })
    }
}

const autenticacao = () => {
    mostrarLoad(document.body)
    //quando a página acabar de carregar o sistema checa se o usuario esta autenticado ou não
    var usuario = JSON.parse(Android.pegarUsuario())
    if(usuario != null){
        setTimeout(() => {
            autenticar(usuario.usuario, usuario.senha)
        }, 250)
    } else {
        setTimeout(() => {
            document.getElementById('login').style.opacity = '1'
            esconderLoad()
        }, 250)
    }
}

const conferirDados = () => {

    var usuario = document.getElementById("usuario").value.toLowerCase()
    var senha = document.getElementById("senha").value

    if (usuario.length <= 3 || senha.length <= 4) {
        error("Usuario/Senha muito curto(s) ou inválido(s)")
    } else {
        autenticar(usuario, senha)
    }
}

const autenticar = (usuario, senha) => {

    mostrarLoad(document.body)
    axios.get('https://us-central1-ioi-printers.cloudfunctions.net/autenticar?usuario=' + usuario + '&senha=' + senha).then(res => {
    if(res.data.autenticado) {
        var usuario = {
            nome: res.data.nome,
            usuario: res.data.usuario,
            senha: res.data.senha,
            empresa: res.data.empresa,
            permissao: res.data.permissao,
            id: res.data.id
        }
        Android.salvarUsuario(JSON.stringify(usuario))
        gravarToken(Android.pegarToken())
        setTimeout(() => {
            document.getElementById('login').remove()
            var layout = document.getElementById('tAtendimentos').content.cloneNode(true)
            document.body.appendChild(layout)
            receberDados()
        }, 250)
    } else {
        esconderLoad()
        setTimeout(() => {
            error("Usuário/Senha incorreto(s)")
        }, 250)
    }
    }).catch(err => {
        console.error(err)
        esconderLoad()
        setTimeout(function(){
            error("Tente novamente mais tarde")
        }, 250)
    })
}

const mostrarLoad = el => {
    var load = document.getElementById('tLoad').content.cloneNode(true)
    el.appendChild(load)
    el.querySelector('#load').style.display = 'flex'

    setTimeout(() => {
        el.querySelector('#load').style.opacity = '1'
    }, 50)
}

const esconderLoad = () => {
    var load = document.body.querySelector('#load')
    load.style.opacity = '0'

    setTimeout(() => {
        load.remove()
    }, 250)
}

const messages = message => {
    document.getElementById("messages").style.bottom = "0px"
    document.getElementById("messages").innerHTML = message

    setTimeout(() => {
        document.getElementById("messages").style.bottom = "-150px"
    }, 7000)
}

const error = message => {
    document.getElementById("error").style.bottom = "0px"
    document.getElementById("error").innerHTML = message

    setTimeout(() => {
        document.getElementById("error").style.bottom = "-150px"
    }, 7000)
}

const enterPressed = e => {
    var code = (e.keyCode ? e.keyCode : e.which)
    if(code == 13) {
        document.getElementById("usuario").blur()
        document.getElementById("senha").blur()
        conferirDados()
    }
}

const receberDados = () => {
    var usuario = JSON.parse(Android.pegarUsuario())
    axios.request('https://us-central1-ioi-printers.cloudfunctions.net/dados', {
        params: {
            plataforma: 'mobile',
            usuario: usuario.usuario,
            senha: usuario.senha
        }
    }).then(res => {
        if(res.data.auth.autenticado) {
            atendimentos = res.data.atendimentos
            suprimentos = res.data.suprimentos
            clientes = res.data.clientes
            listagem()
        } else {
            logout()
            esconderLoad()
        }
    }).catch(err => {
        console.error(err)
        esconderLoad()
        setTimeout(() => {
            error('Tivemos algum problema ao processar os dados. Tente novamente mais tarde!')
        }, 250)
    })
}

const atualizar = () => {
    mostrarLoad(document.body)
    document.querySelectorAll(".atendimento").forEach(el => {
        el.remove()
    })
    receberDados()
}

const logout = () => {
    Android.salvarUsuario(JSON.stringify(null))
    atendimentos = {}
    suprimentos = {}
    clientes = {}
    var login = document.getElementById('tLogin').content.cloneNode(true)
    document.body.appendChild(login)
    document.getElementById('header').remove()
    document.getElementById('listagem').remove()
    autenticacao()
}

const mostrarAcoes = el => {
    var layout = el.parentNode.parentNode.querySelector('.header-menu-content')

    layout.style.display = 'flex'
    setTimeout(() => {
        layout.style.opacity = '1'
    }, 10)
}

const esconderAcoes = el => {
    var layout = el.parentNode.parentNode.querySelector('.header-menu-content')

    layout.style.opacity = '0'
    setTimeout(() => {
        layout.style.display = 'none'
    }, 200)
}

const listagem = () => {

    var container = new DocumentFragment()
    for(var y = 0; y < Object.keys(atendimentos).length; y++) {
        var atendimento = atendimentos[Object.keys(atendimentos)[y]]
    
        container.appendChild(criarInterfaceAtendimento(atendimento))
    }
    document.getElementById('listagem').appendChild(container)
    esconderLoad()
}

const criarInterfaceAtendimento = atendimento => {

    var data = new Date()
    var semana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
    var dia = semana[data.getDay()]

    var interface = document.getElementById('tAtendimento').content.cloneNode(true)
    interface.querySelector('.atendimento').id = atendimento.id
    interface.querySelector('.atendimento').onclick = (atendimento => {
        return () => {expandirAtendimento(atendimento)}
    })(atendimento)

    interface.querySelector('#cliente').innerHTML = atendimento.dados.nomefantasia
    if(atendimento.ordem != 0) {
        interface.querySelector('#ordem').innerHTML = atendimento.ordem + "º"
    }

    var horario = atendimento.dados.horarios[dia]
    if(horario.aberto) {
        interface.querySelector('#horario').innerHTML = horario.horario[0] + " | " + horario.horario[1]
    } else {
        interface.querySelector('#horario').innerHTML = "Fechado"
    }

    var motivo = ''
    atendimento.motivo.forEach((el, index) => {
        if(index < atendimento.motivo.length - 1) {
            motivo = motivo + el + ' - '
        } else {
            motivo = motivo + el
        }
    })
    interface.querySelector('#motivo').innerHTML = motivo
    
    return interface
}

const expandirAtendimento = atendimento => {

    Android.pegarUsuario()
    
}

const fecharAtendimento = () => {
    console.log('atendimento fechado')
}