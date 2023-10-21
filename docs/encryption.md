# Encryption

> **Note**: This is an advanced topic, and intended for technical readers that wish to know more about how the
> end-to-end encryption is implemented in DataGarden.

DataGarden is an end-to-end encrypted data collaboration platform. In this chapter we will provide a quick overview on
where encryption comes into play, and how it is implemented.

**TLDR**: the Signal Protocol is used to enable end-to-end encrypted messaging between users, which allows users to share
encryption keys that are used with Parquet Modular Encryption.

## Preface
DataGarden is a web application, and as such all the libraries mentioned in this section are run in the browser through
various WASM ports. Also see this
[note](https://github.com/pixelcities/datagarden#a-word-on-guaranteeing-e2ee-and-trust-in-browsers) on how to guarantee
the integrity of these libraries.

## Registration
On registration, your password is used (with the email as salt) in a KDF using argon2
<sup>[1](https://github.com/pixelcities/key-x-wasm/blob/main/src/keystore.rs#L308)</sup>: creating the *root key*. The
root key encrypts the data in the internal key vault, under which all the other keys are stored. This is required
because there is no persisted storage in the browser, and even the keys need to be stored somewhere. This makes it that
the root key becomes the single most important failure point, and **it is vital that the password that is used by the user
is very strong**. The argon2 parameters are timed such that the KDF takes about 1-1.5 seconds, but because this happens
on a single core in the browser the cost is not ideal.

The resulting root key is returned with one extra iteration before sending it to the server to verify the login, so that
the server never sees the original password from which it could easily derive the root key. It is hashed again on the
server side, using Argon2.

The Signal Protocol is also initialized on registration. A fresh set of keys is generated, and some pre key bundles are
sent to the server. Because of the Signal Protocol's nature, it needs to retain the state of all the ratchets. After
sending or receiving a message, the state is serialized, encrypted, and stored on the server as a blob. The state is
encrypted using a 256 bit key that is also generated on registration, and stored in the vault using the root key. Again,
if the root key is compromised it must be assumed that the signal state is also compromised.

## Encryption
Whenever anything needs to be encrypted before sending it to the server, it is encrypted using AES-GCM-SIV using a 256
bit key. This includes the keys of the internal vault, the signal protocol state, and any other secrets that are used in
DataGarden (such as title metadata).

## Datasets
In-memory data is represented using Apache Arrow, while "on-disk" data is stored using Apache Parquet. All the data
storage (and encryption) is handled by Apache Parquet. Some (C++) Apache Parquet implementations support "Parquet
Modular Encryption" <sup>[2](https://github.com/apache/parquet-format/blob/master/Encryption.md)</sup>. The modular
encryption refers to per-column encryption, plus the footer (metadata). This matches 1-on-1 with how DataGarden encrypts
and operates with encrypted datasets, and is a perfect fit.

In our use case, the Parquet library will store the data directly to S3. The result is that data is encrypted and sent
to the storage server (S3) without the data ever leaving the device (browser) unencrypted. When loading a dataset, the
reverse happens.

Naturally, the end-to-end encryption makes it that the server cannot do any computations for users of DataGarden.
Instead, the server acts as a scheduler and will ensure all data is up-to-date and consistent by sending instructions to
the clients. A common instruction is to compute your share of a dataset that noone else has access to. The server will
wait for you to come online and instruct any datasets that need updating. The result is that all the data is computed in
the browser on the users' devices, which we believe have become fast enough for most general purpose data processing
tasks.

### Key rotation
Whenever datasets are updated, all the keys are automatically rotated and re-shared. This mostly comes into play whenever
a collaborator's access is revoked from a dataset. At this point the server will no longer allow them to access the
encrypted data, but they technically still have access to the encryption keys. However, we deem this acceptable as they also
had access to the data itself and they could simply own a plaintext copy of the data. Only when the data changes, does it
become important that old keys no longer have access to new data, which is why the keys are only rotated when the data
changes.

## Secret sharing
As previously mentioned, the Signal Protocol <sup>[3](https://github.com/signalapp/libsignal/tree/main/rust/protocol)</sup>
is used to support end-to-end encrypted messaging. Authenticated users can pull pre-key bundles from the server when
starting a communication channel for the first time, and the server will forward any of the encrypted "messages" to each
user.

To share a secret, such as an encryption key for the parquet modular encryption, a user simply has to send a message
using the Signal Protocol. In practice, a message simply contains a key id (UUID) and the secret. When receiving a
message, the user will then be able to encrypt the secret using their own root key in their vault.

In order to verify the security of the messages, the combined public keys ("safety code") can be viewed from within
DataGarden. It's good practice to first verify your collaborators before sharing any keys with them to make sure the
server is not impersonating anyone.

