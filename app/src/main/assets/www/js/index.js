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
    }, 5000)
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
        return () => { expandirAtendimento(atendimento) }
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

    Android.expandirAtendimento(true)
    var layout = document.getElementById('tAtendimentoExpandido').content.cloneNode(true)

    layout.querySelector('#salvar').onclick = (atendimento => {
        return () => { salvarAtendimento(atendimento) }
    })(atendimento)

    layout.querySelector('#cliente').innerHTML = atendimento.dados.nomefantasia
    layout.querySelector('#chave').innerHTML = atendimento.cliente
    layout.querySelector('#chave').innerHTML = atendimento.cliente
    var endereco = atendimento.dados.endereco
    layout.querySelector('#endereco').href = 'http://maps.google.com/maps?q=' + endereco.rua + '+' + endereco.numero + '+' + endereco.cidade
    if(endereco.complemento == '') {
        layout.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ', ' + endereco.cidade + ', ' + endereco.estado
    } else {
        layout.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ' - ' + endereco.complemento + ' - ' + endereco.cidade + ', ' + endereco.estado
    }
    var contato = atendimento.dados.contato
    if(contato.celular == '' && contato.telefone != '') {
        layout.querySelector('#contato').innerHTML = "<a href='tel:" + contato.telefone + "'>" + contato.telefone + "</a>"
    } else if (contato.celular != '' && contato.telefone == '') {
        layout.querySelector('#contato').innerHTML = "<a href='tel:" + contato.celular + "'>" + contato.celular + "</a>"
    } else {
        layout.querySelector('#contato').innerHTML = "<a href='tel:" + contato.telefone + "'>" + contato.telefone + 
                                                        "</a> &nbsp&nbsp|&nbsp&nbsp <a href='tel:" +  contato.celular + "'>" + contato.celular + "</a>"
    }
    layout.querySelector('#sistema').innerHTML = 'Versão ' + atendimento.dados.sistema.versao + ' - ' + atob(atendimento.dados.sistema.local)

    var motivos = new DocumentFragment()
    atendimento.motivo.forEach((motivo, index) => {
        var div = document.createElement('div')
        div.className = 'motivo'
        div.innerHTML = "<input type='checkbox' id='" + index + "' name='" + index + "'><label for='" + index + "'>" + motivo +"</label>"
        motivos.appendChild(div)
    })
    layout.querySelector('#motivos').appendChild(motivos)

    document.body.appendChild(layout)
    setTimeout(() => {
        document.getElementById('atendimentoExpandido').style.opacity = '1'
    }, 10)
}

const fecharAtendimento = () => {
    
    Android.expandirAtendimento(false)
    var atendimento = document.getElementById('atendimentoExpandido')
    atendimento.style.opacity = 0

    setTimeout(() => {
        atendimento.remove()
    }, 250)
}

const salvarAtendimento = atendimento => {

    var layout = document.getElementById('atendimentoExpandido')
    var todos = true
    layout.querySelectorAll('input').forEach(motivo => {
        if(!motivo.checked) {
            todos = false
        }
    })

    if(todos ) {
        var data = new Date()
        var ano = data.getFullYear()
        var mes = data.getMonth() + 1
        if (mes < 10) { mes = "0" + mes }
        var dia = data.getDate()
        if (dia < 10) { dia = "0" + dia }
        atendimento.feito = true
        atendimento.datas = {
            inicio: atendimento.datas.inicio,
            fim: ano + '-' + mes + '-' + dia
        }

        if(confirm('Todas as impressoras foram abastecidas?')) {
            encherTintas(atendimento.dados)
        }
        delete atendimento.dados
        gravarAtendimento({[atendimento.id]: atendimento})
    } else {
        var algumFeito = false
        layout.querySelectorAll('.motivo').forEach(motivo => {
            
            var checkbox = motivo.querySelector('input')
            var label = motivo.querySelector('label')
            if(checkbox.checked) {
                algumFeito = true
                const index = atendimento.motivo.indexOf(label.innerHTML)
                if (index > -1) {
                    atendimento.motivo.splice(index, 1)
                }
            }
        })

        if(algumFeito) {
            atendimento.responsavel = ''
            delete atendimento.dados
            gravarAtendimento({[atendimento.id]: atendimento})
        } else {
            error('Marque um/todos os itens como feitos antes de salvar!')
        }
    }
}

const gravarAtendimento = atendimento => {
    
    fecharAtendimento()
    messages('Gravando dados, aguarde!')
    var usuario = JSON.parse(Android.pegarUsuario())
    axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarAtendimentos', {
        params: {
            usuario: usuario.usuario,
            senha: usuario.senha,
            atendimentos: JSON.stringify(atendimento)
        }
    }).then(res => {
        if(res.data.autenticado) {
            if(res.data.erro) {
                error(res.data.msg)
            } else {
                messages('Dados gravados com sucesso!')
                atualizar()
            }
        } else {
            error('Tivemos algum problema de autenticação. Reabra o aplicativo e tente novamente!')
        }
    }).catch(err => {
        console.error(err)
        error('Erro ao gravar os dados. Alterações não foram salvas')
    })
}

const encherTintas = cliente => {

    var impressoras = cliente.impressoras
    for(var y = 0; y < Object.keys(impressoras).length; y++) {
        var impressora = impressoras[Object.keys(impressoras)[y]]
        
        if(impressora.ativa && impressora.tinta.capacidade != 'ilimitado') {
            impressora.tinta.cheio = impressora.tinta.cheio + impressora.tinta.impresso
            impressora.tinta.impresso = 0
            impressora.tinta.nivel = 100
        }
    }

    var usuario = JSON.parse(Android.pegarUsuario())
    axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
        params: {
            usuario: usuario.usuario,
            senha: usuario.senha,
            cliente: JSON.stringify(cliente)
        }
    }).then(res => {
        if(res.data.autenticado) {
            if(res.data.erro) {
                error(res.data.msg)
            } else {
                messages('Todas as impressoras foram marcadas como cheias!')
            }
        } else {
            error('Tivemos algum problema de autenticação. Reabra o aplicativo e tente novamente!')
        }
    }).catch(err => {
        console.error(err)
        error('Erro ao gravar os dados. Reabra o aplicativo e tente novamente!')
    })
}