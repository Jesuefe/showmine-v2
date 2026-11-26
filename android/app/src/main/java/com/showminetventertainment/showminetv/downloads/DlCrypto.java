package com.showminetventertainment.showminetv.downloads;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.math.BigInteger;
import java.security.KeyStore;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Encryption for offline downloads.
 *
 * Each download gets its own random 256-bit content key. That key is stored
 * only in wrapped form, encrypted by a master key that lives in the Android
 * Keystore and can never be read out of the phone. Video files are written
 * as: 16-byte random IV, then AES-256-CTR ciphertext (CTR lets the player
 * seek anywhere without decrypting from the start).
 */
public final class DlCrypto {
    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String MASTER_ALIAS = "showmine_downloads_v1";
    private static final SecureRandom RNG = new SecureRandom();

    private DlCrypto() {}

    private static SecretKey masterKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(KEYSTORE);
        ks.load(null);
        if (ks.containsAlias(MASTER_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) ks.getEntry(MASTER_ALIAS, null)).getSecretKey();
        }
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        kg.init(new KeyGenParameterSpec.Builder(MASTER_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return kg.generateKey();
    }

    /** New random content key, returned wrapped ("iv:ciphertext", base64). */
    public static String newWrappedKey() throws Exception {
        byte[] raw = new byte[32];
        RNG.nextBytes(raw);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, masterKey());
        byte[] ct = c.doFinal(raw);
        java.util.Arrays.fill(raw, (byte) 0);
        return b64(c.getIV()) + ":" + b64(ct);
    }

    public static byte[] unwrap(String wrapped) throws Exception {
        String[] p = wrapped.split(":");
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, masterKey(), new GCMParameterSpec(128, unb64(p[0])));
        return c.doFinal(unb64(p[1]));
    }

    public static byte[] newIv() {
        byte[] iv = new byte[16];
        RNG.nextBytes(iv);
        return iv;
    }

    /** AES-CTR cipher positioned at the 16-byte block containing {@code offset}. */
    public static Cipher ctrAt(byte[] key, byte[] iv, long offset, int mode) throws Exception {
        long block = offset / 16;
        BigInteger ctr = new BigInteger(1, iv).add(BigInteger.valueOf(block));
        byte[] b = ctr.toByteArray();
        byte[] counter = new byte[16];
        int n = Math.min(16, b.length);
        System.arraycopy(b, b.length - n, counter, 16 - n, n);   // keep the low 128 bits
        Cipher c = Cipher.getInstance("AES/CTR/NoPadding");
        c.init(mode, new SecretKeySpec(key, "AES"), new IvParameterSpec(counter));
        int skip = (int) (offset % 16);
        if (skip > 0) c.update(new byte[skip]);
        return c;
    }

    private static String b64(byte[] b) { return Base64.encodeToString(b, Base64.NO_WRAP); }
    private static byte[] unb64(String s) { return Base64.decode(s, Base64.NO_WRAP); }
}
