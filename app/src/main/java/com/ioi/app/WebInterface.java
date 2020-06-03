package com.ioi.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class WebInterface {
    private Context context;
    static boolean atendimentoExpandido = false;

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
    public void expandirAtendimento(boolean expandido) {
        atendimentoExpandido = expandido;
    }

    @JavascriptInterface
    public void atualizar(String url) {
        Principal principal = (Principal) context;
        principal.verificarPermissao(url);
    }
}
