package com.ioi.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class WebInterface {
    private Context context;
    static boolean atendimentoExpandido = false;
    static boolean acoesExpandidas = false;
    static boolean novoAtendimento = false;

    WebInterface(Context c) {
        context = c;
    }

    @JavascriptInterface
    public void salvarUsuario(String usuario) {
        SharedPreferences localstorage = context.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        localstorage.edit().putString("usuario", usuario).apply();
    }

    @JavascriptInterface
    public String pegarUsuario() {
        SharedPreferences localstorage = context.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        return(localstorage.getString("usuario", null));
    }

    @JavascriptInterface
    public String pegarToken() {
        SharedPreferences localstorage = context.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        return(localstorage.getString("token", null));
    }

    @JavascriptInterface
    public void expandirAcoes(boolean expandido) {
        acoesExpandidas = expandido;
    }

    @JavascriptInterface
    public void expandirAtendimento(boolean expandido) {
        atendimentoExpandido = expandido;
    }

    @JavascriptInterface
    public void novoAtendimento(boolean expandido) {
        novoAtendimento = expandido;
    }

    @JavascriptInterface
    public void atualizar(String url) {
        Principal principal = (Principal) context;
        principal.verificarPermissao(url);
    }

    @JavascriptInterface
    public void salvarAtendimentos(String atendimentos) {
        SharedPreferences localstorage = context.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        localstorage.edit().putString("atendimentos", atendimentos).apply();
    }

    @JavascriptInterface
    public String pegarAtendimentos() {
        SharedPreferences localstorage = context.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        System.out.println(localstorage.getString("atendimentos", null));
        return(localstorage.getString("atendimentos", null));
    }
}
