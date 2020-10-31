const versao = '0.1.2'
var usuario
var atendimentos
var suprimentos
var clientes

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
    var dados = Android.pegarUsuario()
    if(dados != null){
        usuario = JSON.parse(dados)
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

const autenticar = (login, senha) => {

    mostrarLoad(document.body)
    axios.get('https://us-central1-ioi-printers.cloudfunctions.net/autenticar?usuario=' + login + '&senha=' + senha).then(res => {
    if(res.data.autenticado) {
        usuario = {
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
            receberDados(false)
        }, 250)
    } else {
        esconderLoad()
        setTimeout(() => {
            error("Usuário/Senha incorreto(s)")
        }, 250)
    }
    }).catch(err => {
        setTimeout(() => {
            var cache = Android.pegarAtendimentos()
            console.log(cache)
            if(cache != null) {
                document.getElementById('login').remove()
                var local = JSON.parse(cache)
                atendimentos = local.atendimentos
                suprimentos = local.suprimentos
                clientes = local.clientes
                listagem(true)
            } else {
                esconderLoad()
                error("Verifique a conexão com a internet!")
            }
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
    }, 4000)
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

const receberDados = atualizando => {
    axios.request('https://us-central1-ioi-printers.cloudfunctions.net/dados', {
        params: {
            plataforma: 'mobile',
            usuario: usuario.usuario,
            senha: usuario.senha,
            sistema: 'android',
            versao: versao
        }
    }).then(res => {
        if(res.data.atualizar) {
            update(res.data)
        } else if(res.data.auth.autenticado) {
            atendimentos = res.data.atendimentos
            suprimentos = res.data.suprimentos
            clientes = res.data.clientes
            Android.salvarAtendimentos(JSON.stringify(res.data))
            if(atualizando) {
                listagem(false)
            } else {
                listagem(true)
            }
        } else {
            logout()
            esconderLoad()
        }
    }).catch(err => {
        console.log(err)
        setTimeout(() => {
            var cache = Android.pegarAtendimentos()
            console.log(cache)
            if(cache != null) {
                var local = JSON.parse(cache)
                atendimentos = local.atendimentos
                suprimentos = local.suprimentos
                clientes = local.clientes
                if(atualizando) {
                    listagem(false)
                } else {
                    listagem(true)
                }
            } else {
                esconderLoad()
                error('Tivemos algum problema ao processar os dados. Tente novamente mais tarde!')
            }
        }, 250)
    })
}

const atualizar = () => {
    mostrarLoad(document.body)
    document.querySelectorAll(".atendimento").forEach(el => {
        el.remove()
    })
    receberDados(true)
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

const listagem = criarMenu => {
    if(criarMenu) {
        var layout = document.getElementById('tAtendimentos').content.cloneNode(true)
        document.body.appendChild(layout)
    }

    //remove qualquer outro elemento que indique a falta de atendimentos
    //e adiciona abaixo caso precise
    var limpo = document.body.querySelector('#limpo')
    if(limpo != null && limpo != undefined) {
        limpo.remove()
    }
    
    var container = new DocumentFragment()
    if(Object.keys(atendimentos).length > 0) {
        for(var y = 0; y < Object.keys(atendimentos).length; y++) {
            var atendimento = atendimentos[Object.keys(atendimentos)[y]]
            container.appendChild(criarInterfaceAtendimento(atendimento))
        }
    } else {
        container.appendChild(document.getElementById('tLimpo').content.cloneNode(true))
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
        interface.querySelector('#ordem').innerHTML = atendimento.ordem + "&deg"
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

        if(confirm('Marcar todas as impressoras como abastecidas?')) {
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
            if(confirm('Deseja salvar o atendimento sem nenhum item feito?')) {
                atendimento.responsavel = ''
                delete atendimento.dados
                gravarAtendimento({[atendimento.id]: atendimento})
            }
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
    if(impressoras != undefined && impressoras != null) {
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
}

const update = dados => {
    esconderLoad()
    mostrarUpdate(document.body)
    Android.atualizar(dados.url)
}

const mostrarUpdate = el => {
    var update = document.getElementById('tUpdate').content.cloneNode(true)
    el.appendChild(update)
    el.querySelector('#update').style.display = 'flex'

    setTimeout(() => {
        el.querySelector('#update').style.opacity = '1'
    }, 50)
} 

const mostrarAdd = () => {
    Android.expandirAcoes(true)
    var fab = document.getElementById('fab')
    var add = fab.querySelector('i')
    var buttons = document.getElementById('fab-buttons')

    add.style.opacity = '0'
    fab.style.width = '300px'
    fab.style.height = '100px'
    fab.style.borderRadius = '5px'

    setTimeout(() => {
        add.style.display = 'none'
        buttons.style.display = 'flex'
    }, 200)
}

const esconderAdd = () => {
    Android.expandirAcoes(false)
    var fab = document.getElementById('fab')
    var add = fab.querySelector('i')
    var buttons = document.getElementById('fab-buttons')

    setTimeout(() => {
        buttons.style.display = 'none'
        add.style.display = 'inline-block'
    
        setTimeout(() => {
            add.style.opacity = '1'        
            fab.style.width = '50px'
            fab.style.height = '50px'

            setTimeout(() => {
                fab.style.borderRadius = '50%'
            }, 100)
        }, 200)
    }, 10)  
}

const novoAtendimento = () => {
    Android.novoAtendimento(true)
    var layout = document.getElementById('tNovoAtendimento').content.cloneNode(true)
    layout.querySelector('#salvar').onclick = () => {salvarNovoAtendimento()}

    var nomes = layout.querySelector('#cliente')
    autoCompleteClientes(nomes)

    var option = document.createElement('option')
    option.value = usuario.nome
    option.innerHTML = usuario.nome
    layout.querySelector('#responsavel').appendChild(option)

    var adicionarMotivo = document.getElementById('tAtendimentoAdicionar').content.cloneNode(true)
    var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
    autoCompleteMotivos(motivo.querySelector('.mtmotivo-texto'))
    layout.querySelector('.mtmotivo-list').appendChild(motivo)
    layout.querySelector('.mtmotivo-list').appendChild(adicionarMotivo)

    document.body.appendChild(layout)
    setTimeout(() => {
        document.getElementById('novoAtendimento').style.opacity = '1'
    }, 10)
}

const fecharNovoAtendimento = () => {
    Android.novoAtendimento(false)
    var atendimento = document.getElementById('novoAtendimento')
    atendimento.style.opacity = 0

    setTimeout(() => {
        atendimento.remove()
    }, 250)
}

const autoCompleteClientes = input => {
    /* precisa de dois parâmetros: o input de textos e o array de clientes */
      var currentFocus
      /* adiciona um listener quando for digitado alguma coisa */
      input.addEventListener('input', function(e) {
    
      var a, b, i, val = this.value
      closeAllLists()
      
        if (!val) { return false }
      currentFocus = -1
  
        a = document.createElement('DIV')
        a.setAttribute('id', this.id + 'autocomplete-list')
        a.setAttribute('class', 'autocomplete')
      this.parentNode.appendChild(a)
      
      for(var x = 0; x < Object.keys(clientes).length; x++) {
        var cliente = clientes[Object.keys(clientes)[x]]
  
        /* checa as letras compativeis no nome fantasia */
        if (cliente.nomefantasia.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val.toLowerCase() ) > -1 
            || cliente.razaosocial.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val.toLowerCase() ) > -1) {
          
          /* cria uma div para cada item que tenha correspondencia */
          b = document.createElement('DIV')
          if (cliente.nomefantasia.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val.toLowerCase() ) > -1) {
            b.innerHTML = cliente.nomefantasia
          } else if (cliente.razaosocial.toLowerCase().normalize('NFD').replace(/[^a-zA-Zs]/g, '').indexOf( val.toLowerCase() ) > -1) {
            b.innerHTML = cliente.razaosocial
          }
  
          /* cria um input invisivel que vai segurar o valor do item */
          b.innerHTML += "<input type='hidden' value='" + cliente.id + "'>"
          /* executa a função quando for clicado na div do item */
          b.addEventListener('click', function(e) {
            //quando clicar em um item do autocomplete, define o valor
            input.value = clientes[this.getElementsByTagName('input')[0].value].nomefantasia
            mostrarDadosCliente(clientes[this.getElementsByTagName('input')[0].value], input)
            closeAllLists()
          })
          a.appendChild(b)
        }
        }
    })
    
    const closeAllLists = elmnt => {
      /* fecha todas as listas do documento, exceto a passada como argumento */
      var x = document.querySelectorAll('.autocomplete')
      x.forEach(el => {
        if (elmnt != el && elmnt != input) {
          el.parentNode.removeChild(el)
        }
      })
    }
      
      /* executa a função quando alguem clicar fora da lista */
      document.addEventListener('click', e => {
        closeAllLists(e.target)
      })
}
  
const autoCompleteMotivos = input => {
    /* precisa de dois parâmetros: o input de textos e o array de clientes */
      var currentFocus
      /* adiciona um listener quando for digitado alguma coisa */
      input.addEventListener('input', function(e) {
    
      var a, b, i, val = this.value
      closeAllLists()
      
        if (!val) { return false }
      currentFocus = -1
  
        a = document.createElement('DIV')
        a.setAttribute('id', this.id + 'autocomplete-list')
        a.setAttribute('class', 'autocomplete')
      this.parentNode.appendChild(a)
      
      for(var x = 0; x < Object.keys(suprimentos).length; x++) {
        var suprimento = suprimentos[Object.keys(suprimentos)[x]]
  
        /* checa as letras compativeis no nome fantasia */
        if (suprimento.modelo.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
          /* cria uma div para cada item que tenha correspondencia */
          b = document.createElement('DIV')
          b.innerHTML = suprimento.modelo + ' - Em estoque: ' + suprimento.quantidade + ' unidades'
          /* cria um input invisivel que vai segurar o valor do item */
          b.innerHTML += "<input type='hidden' value='" + suprimento.id + "'>"
          /* executa a função quando for clicado na div do item */
          b.addEventListener('click', function(e) {
            //quando clicar em um item do autocomplete, define o valor
            input.value = suprimentos[this.getElementsByTagName('input')[0].value].modelo
            mostrarQuantidades(input, suprimentos[this.getElementsByTagName('input')[0].value], true)
            closeAllLists()
          })
          a.appendChild(b)
        }
        }
    })
    
    const closeAllLists = elmnt => {
      /* fecha todas as listas do documento, exceto a passada como argumento */
        
      var x = document.querySelectorAll('.autocomplete')
      x.forEach(el => {
        if (elmnt != el && elmnt != input) {
          el.parentNode.removeChild(el)
        }
      })
    }
  
      /* executa a função quando alguem clicar fora da lista */
      document.addEventListener('click', e => {
        closeAllLists(e.target)
      })
}

const adicionarMotivo = el => {
    var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
    var container = motivo.querySelector('.mtmotivo')
    autoCompleteMotivos(motivo.querySelector('.mtmotivo-texto'))
    container.style.opacity = '0'
    $(motivo).insertBefore(el.parentNode)
    setTimeout(() => {
        container.style.opacity = '1'
    }, 50)
}

const mostrarDadosCliente = (cliente, input) => {

    var container = input.parentNode.parentNode.parentNode.parentNode
    var dados = container.querySelector('#dados')
    var editClient = container.querySelector('#editCliente')
  
    var endereco = cliente.endereco
    dados.querySelector('#endereco').href = 'http://maps.google.com/maps?q=' + endereco.rua + '+' + endereco.numero + '+' + endereco.cidade
    if(endereco.complemento == '') {
        dados.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ', ' + endereco.cidade + ', ' + endereco.estado
    } else {
        dados.querySelector('#endereco').innerHTML = endereco.rua + ', ' + endereco.numero + ' - ' + endereco.complemento + ' - ' + endereco.cidade + ', ' + endereco.estado
    }

    var contato = cliente.contato
    if(contato.celular == '' && contato.telefone != '') {
        dados.querySelector('#telefone').innerHTML = "<a href='tel:" + contato.telefone + "'>" + contato.telefone + "</a>"
    } else if (contato.celular != '' && contato.telefone == '') {
        dados.querySelector('#telefone').innerHTML = "<a href='tel:" + contato.celular + "'>" + contato.celular + "</a>"
    } else {
        dados.querySelector('#telefone').innerHTML = "<a href='tel:" + contato.telefone + "'>" + contato.telefone + 
                                                        "</a> &nbsp&nbsp|&nbsp&nbsp <a href='tel:" +  contato.celular + "'>" + contato.celular + "</a>"
    }
  
    editClient.style.minWidth = '20px'
    editClient.style.maxWidth = '20px'
    editClient.style.maxHeight = '20px'
    editClient.style.marginRight = '8px'
    editClient.style.padding = '5px'
    editClient.style.opacity = '1'
    editClient.onclick = () => { 
        fecharNovoAtendimento()
        setTimeout(() => {
            //expandirCliente(cliente)
        }, 50) 
    }
  
    dados.querySelector('#chave').innerHTML = 'Chave: ' + cliente.id + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Versão: ' + cliente.sistema.versao + '<br>Local inst.: ' + atob(cliente.sistema.local) 
    dados.style.height = 'fit-content'
    dados.style.opacity = '1'
}

const suprimentoPorModelo = modelo => {
    for(var x = 0; x < Object.keys(suprimentos).length; x++) {
        var suprimento = suprimentos[Object.keys(suprimentos)[x]]
    
        if(suprimento.modelo == modelo) {
            return suprimento
        }
    }
}
  
const clientePorNome = nome => {
    for(var x = 0; x < Object.keys(clientes).length; x++) {
        var cliente = clientes[Object.keys(clientes)[x]]
    
        if(cliente.nomefantasia == nome || cliente.razaosocial == nome) {
            return cliente
        }
    }
}
  
const mostrarQuantidades = (el, suprimento, alterarQuantidade) => {
    var container = el.parentNode.parentNode
    var quantidade = container.querySelector('.quantidade')
    quantidade.style.width = '100px'
    quantidade.style.marginLeft = '8px'
    quantidade.style.marginRight = '8px'
    quantidade.style.opacity = '1'
    
    var input = quantidade.querySelector('.motivo-quantidade')
    if(parseInt(input.value) > parseInt(suprimento.quantidade) && alterarQuantidade) {
        input.value = suprimento.quantidade
    }
  
    if(suprimento.quantidade == 0) {
        input.value = 0
    }
}

const salvarNovoAtendimento = () => {
    var layout = document.body.querySelector('#novoAtendimento')
    var cliente = clientePorNome(layout.querySelector('#cliente').value)
    var motivos = layout.querySelectorAll('.mtmotivo-texto')
    var erro = false
  
    var data = new Date()
    var ano = data.getFullYear()
    var mes = data.getMonth() + 1
    if (mes < 10) { mes = "0" + mes }
    var dia = data.getDate()
    if (dia < 10) { dia = "0" + dia }
  
    atendimento = new Object()
    atendimento.id = data.getTime() + ''
    atendimento.datas = {
        inicio: ano + '-' + mes + '-' + dia,
        fim: ''
    }
    atendimento.ordem = 0
  
    if(cliente == undefined) {
        error('Cliente inválido ou não cadastrado!')
        erro = true
    } else {
        atendimento.cliente = cliente.id
    }
    
    if(!erro) {
        for(var x = 0; x < Object.keys(atendimentos).length; x++) {
            var at = atendimentos[Object.keys(atendimentos)[x]]
            
            if((at.responsavel == '' || at.responsavel == layout.querySelector('#responsavel').value) 
            && at.cliente == atendimento.cliente && !at.feito && at.id != atendimento.id) {
    
                error('Já existe um atendimento em aberto para esse cliente!')
                erro = true
                break
            }
        }
    }
    
    if(!erro) {
        for(var x = 0; x < motivos.length; x++) {
            var motivo = motivos[x]
        
            if(motivo.value == '' && motivos.length < 2) {
                error('Motivo muito curto ou vazio!')
                erro = true
                break
            }
        }
    }
  
    if(!erro) {
        var motivoLocal = []
        
        for(var x = 0; x < motivos.length; x++) {
            var motivo = motivos[x]
            var suprimento = suprimentoPorModelo(motivo.value)
    
            if(suprimento != undefined) {
                //caso o motivo seja um toner ou suprimento
                var quantidade = parseInt(motivo.parentNode.parentNode.querySelector('.motivo-quantidade').value)
                if(quantidade > suprimento.quantidade) {
                    error('A quantidade de toner não pode ser maior que a quantidade em estoque!')
                    erro = true
                    break
                } else {
                    motivoLocal.push(suprimento.modelo + ' - Quantidade: ' + quantidade)
                    suprimento.quantidade = suprimento.quantidade - quantidade 
                    conferirQuantidadeSuprimento(suprimento)
                }
            } else if(motivo.value != '') {
                motivoLocal.push(motivo.value)
            }
        }
        atendimento.motivo = motivoLocal
    
        atendimento.responsavel = layout.querySelector('#responsavel').value
        if(layout.querySelector('#status').value == "Feito") {
            atendimento.feito = true
            atendimento.datas = {
                inicio: atendimento.datas.inicio,
                fim: ano + '-' + mes + '-' + dia
            }
        } else {
            atendimento.feito = false
            atendimento.datas = {
                inicio: atendimento.datas.inicio,
                fim: ''
            }
        }
    
        if(!erro) {
            fecharNovoAtendimento()
            atendimentos[atendimento.id] = atendimento
        
            delete atendimento.dados
            delete atendimento.tecnico
            mostrarLoad(document.body)
            gravarSuprimentos()
            gravarAtendimentos({[atendimento.id]: atendimento})
        }
    }
}

const gravarSuprimentos = () => {
    messages('Gravando dados, aguarde!')
    axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarSuprimentos', {
        params: {
            usuario: usuario.usuario,
            senha: usuario.senha,
            suprimentos: JSON.stringify(suprimentos)
        }
    }).then(res => {
        if(res.data.autenticado) {
            if(res.data.erro) {
                error(res.data.msg)
            } else {
                messages('Suprimentos atualizados!')
            }
        } else {
            error('Tivemos algum problema com a autenticação, tente mais tarde!')
        }
    }).catch(err => {
        error('Erro ao gravar os dados. Alterações não foram salvas!')
    })
}

const gravarAtendimentos = atendimento => {
    messages('Gravando dados, aguarde!')
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
                messages('Atendimentos atualizados!')
                atualizar()
            }
        } else {
            error('Tivemos algum problema com a autenticação, tente mais tarde!')
        }
    }).catch(err => {
        error('Erro ao gravar os dados. Alterações não foram salvas. Tente mais tarde!')
    })
}

const novoCliente = () => {
    console.log('novo cliente')
}


