package com.ioi.app;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class Principal extends AppCompatActivity {

    private WebView webview;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_principal);

        webview = findViewById(R.id.webview);
        webview.getSettings().setJavaScriptEnabled(true);
        webview.addJavascriptInterface(new WebInterface(this), "Android");
        webview.loadUrl("file:///android_asset/www/index.html");
        webview.setWebChromeClient(new WebChromeClient());
    }

    @Override
    public void onBackPressed() {
        if(WebInterface.atendimentoExpandido) {
            webview.loadUrl("javascript:fecharAtendimento()");
        } else {
            super.onBackPressed();
        }
    }
}
