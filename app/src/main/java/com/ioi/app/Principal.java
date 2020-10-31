package com.ioi.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import java.io.File;

public class Principal extends AppCompatActivity {

    private static final int PERMISSION_STORAGE_CODE = 1000;
    private WebView webview;
    private String url;

    @SuppressLint("SetJavaScriptEnabled")
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
        } else if(WebInterface.acoesExpandidas) {
            webview.loadUrl("javascript:esconderAdd()");
        } else if(WebInterface.novoAtendimento) {
            webview.loadUrl("javascript:fecharNovoAtendimento()");
        } else {
            super.onBackPressed();
        }
    }

    public void verificarPermissao(String u) {
        url = u;
        if(checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_DENIED) {
            String[] permissions = {Manifest.permission.WRITE_EXTERNAL_STORAGE};
            requestPermissions(permissions, PERMISSION_STORAGE_CODE);
        } else {
            downloadUpdate();
        }
    }

    private void downloadUpdate() {
        String destination = getExternalFilesDir(null) + "/Download/update.apk";
        File file = new File(destination);
        if (file.exists()) {
            file.delete();
        }
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI | DownloadManager.Request.NETWORK_MOBILE);
        request.setTitle("Mundo Eletrônico");
        request.setDescription("Atualizando o aplicativo!");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationUri(Uri.fromFile(file));
        DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        assert manager != null;
        manager.enqueue(request);
        
        registerReceiver(new BroadcastReceiver() {
            public void onReceive(Context context, Intent i) {
                Intent install = new Intent(Intent.ACTION_INSTALL_PACKAGE);
                install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Uri uri = FileProvider.getUriForFile(context, context.getApplicationContext().getPackageName() + ".provider", file);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                startActivity(install);
                unregisterReceiver(this);
                finish();
            }
        }, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == PERMISSION_STORAGE_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                downloadUpdate();
            }
        }
    }
}
