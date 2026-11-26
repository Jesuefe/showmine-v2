package com.showminetventertainment.showminetv.downloads;

import android.net.Uri;

import androidx.annotation.Nullable;
import androidx.media3.common.C;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.BaseDataSource;
import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.DataSpec;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;

import javax.crypto.Cipher;

/**
 * Reads a download for the player, decrypting on the fly in memory.
 * Only files inside that one download's folder can be opened.
 */
@UnstableApi
public class EncryptedDataSource extends BaseDataSource {
    private final File dir;
    private final byte[] key;
    private RandomAccessFile raf;
    private Cipher cipher;
    private boolean encrypted;
    private long remaining;
    private Uri uri;
    private boolean opened;
    private final byte[] buf = new byte[64 * 1024];

    public EncryptedDataSource(File dir, byte[] key) {
        super(false);
        this.dir = dir;
        this.key = key;
    }

    @Override
    public long open(DataSpec spec) throws IOException {
        uri = spec.uri;
        transferInitializing(spec);
        File f = new File(uri.getPath() == null ? "" : uri.getPath()).getCanonicalFile();
        if (!f.getPath().startsWith(dir.getCanonicalPath() + File.separator)) throw new IOException("Blocked path");
        raf = new RandomAccessFile(f, "r");
        encrypted = f.getName().endsWith(".enc");
        long header = encrypted ? 16 : 0;
        long plainLen = raf.length() - header;
        long pos = spec.position;
        if (pos > plainLen) throw new IOException("Seek past end");
        try {
            if (encrypted) {
                byte[] iv = new byte[16];
                raf.seek(0);
                raf.readFully(iv);
                cipher = DlCrypto.ctrAt(key, iv, pos, Cipher.DECRYPT_MODE);
            }
        } catch (Exception e) {
            throw new IOException("Can't unlock this download", e);
        }
        raf.seek(header + pos);
        remaining = spec.length != C.LENGTH_UNSET ? Math.min(spec.length, plainLen - pos) : plainLen - pos;
        opened = true;
        transferStarted(spec);
        return remaining;
    }

    @Override
    public int read(byte[] target, int offset, int length) throws IOException {
        if (length == 0) return 0;
        if (remaining == 0) return C.RESULT_END_OF_INPUT;
        int want = (int) Math.min(Math.min(length, remaining), buf.length);
        int n = raf.read(buf, 0, want);
        if (n <= 0) return C.RESULT_END_OF_INPUT;
        if (encrypted) {
            try {
                int out = cipher.update(buf, 0, n, target, offset);
                if (out != n) throw new IOException("Decrypt length mismatch");
            } catch (javax.crypto.ShortBufferException e) {
                throw new IOException(e);
            }
        } else {
            System.arraycopy(buf, 0, target, offset, n);
        }
        remaining -= n;
        bytesTransferred(n);
        return n;
    }

    @Nullable @Override public Uri getUri() { return uri; }

    @Override
    public void close() throws IOException {
        uri = null;
        cipher = null;
        if (raf != null) {
            try { raf.close(); } finally {
                raf = null;
                if (opened) { opened = false; transferEnded(); }
            }
        }
    }

    public static class Factory implements DataSource.Factory {
        private final File dir; private final byte[] key;
        public Factory(File dir, byte[] key) { this.dir = dir; this.key = key; }
        @Override public DataSource createDataSource() { return new EncryptedDataSource(dir, key); }
    }
}
