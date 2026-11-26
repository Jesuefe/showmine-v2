package com.showminetventertainment.showminetv;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.showminetventertainment.showminetv.downloads.SecureDownloadsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecureDownloadsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
