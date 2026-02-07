import React, { useEffect, useState } from 'react';
import { useAuthContext } from './services/authContext';
import LoginForm from './components/LoginForm';
import './App.css';

function App() {
    const { user, logout, loading } = useAuthContext();

    const [productID, setProductID] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [ingredientsCID, setIngredientsCID] = useState('');
    const [certificateCID, setCertificateCID] = useState('');
    const [appealReason, setAppealReason] = useState('');
    const [response, setResponse] = useState({ message: '', time: '' });
    const [applicationDetails, setApplicationDetails] = useState({});
    const [file, setFile] = useState(null);
    const [cid, setCid] = useState('');
    const [popup, setPopup] = useState(null);
    const [overlay, setOverlay] = useState(false);

    const identitiesByOrg = {
        org1: ['org1Admin', 'org1User'],
        org2: ['org2Admin', 'org2User'],
    };

    const API_BASE = 'http://localhost:8081';

    const handleReset = async (endpoint) => {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org: user.org,
                    identity: user.identity,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');
            setApplicationDetails({});
            setResponse({
                message: 'Reset successful',
                time: `${new Date()
                    .toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' })
                    .replace(' ', 'T')}`,
            });
        } catch (err) {
            setResponse({ message: `Error: ${err.message}`, time: '' });
        }
    };

    const handleSubmit = async (endpoint, payload) => {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    org: user.org,
                    identity: user.identity,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');
            setResponse({
                message: data.result.message,
                time: `Time: ${data.result.time}`,
            });
            handleQuery('readState', { productID: payload.productID });
        } catch (err) {
            setResponse({ message: `Error: ${err.message}`, time: '' });
        }
    };

    const handleQuery = async (endpoint, payload) => {
        try {
            const query = new URLSearchParams({
                org: user.org,
                identity: user.identity,
                productID: payload.productID,
            }).toString();

            const res = await fetch(`${API_BASE}/${endpoint}?${query}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');

            const productID = payload.productID;
            setApplicationDetails((prev) => ({
                ...prev,
                [productID]: {
                    id: productID,
                    details: data.result,
                },
            }));
        } catch (err) {
            setApplicationDetails((prev) => ({
                ...prev,
                [productID]: {
                    id: productID,
                    error: err.message,
                },
            }));
        }
    };

    const handleUploadToIPFS = async (endpoint, productID, type) => {
        const file = uploadedFiles[productID].file;
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();
        const cid = data.cid;

        if (type === 'ingredients') {
            setIngredientsCID(cid);
            const registerList = await fetch(
                `${API_BASE}/registerIngredientsList`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        org: user.org,
                        identity: user.identity,
                        productID: productID,
                        ingredientsCID: cid,
                    }),
                }
            );
            handleQuery('readState', { productID });
            setResponse({
                message: `File uploaded to IPFS! CID: ${cid}`,
                time: '',
            });
        } else if (type === 'certificate') {
            setCertificateCID(cid);
            const registerCertificate = await fetch(
                `${API_BASE}/approveHalalCertification`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        org: user.org,
                        identity: user.identity,
                        productID: productID,
                        certificateCID: cid,
                    }),
                }
            );
            handleQuery('readState', { productID });

            const data = await registerCertificate.json();

            setResponse({
                message: data.result.message,
                time: data.result.time,
            });
        } else if (type === 'certificate-after-appeal') {
            setCertificateCID(cid);
            const registerCertificate = await fetch(
                `${API_BASE}/approveAfterAppeal`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        org: user.org,
                        identity: user.identity,
                        productID: productID,
                        certificateCID: cid,
                    }),
                }
            );
            handleQuery('readState', { productID });

            const data = await registerCertificate.json();

            setResponse({
                message: data.result.message,
                time: data.result.time,
            });
        }
    };

    const handleReadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/readFile`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        setTimeout(() => {
            setResponse({
                message: data.message,
                time: data.compliance,
            });
        }, 5000);
    };

    if (!user) {
        return (
            <div className="App">
                <h1 className="title">Halal Certification Dashboard</h1>
                <LoginForm />
            </div>
        );
    }

    return (
        <div className="App">
            <div id="nav">
                <h1 className="title">Halal Certification Dashboard</h1>
                <button id="logout" className="red-button" onClick={logout}>
                    Logout
                </button>
                <button id="reset" onClick={() => handleReset('InitLedger')}>
                    Reset
                </button>
                <button
                    id="get"
                    onClick={() =>
                        handleQuery('readState', { productID: '123' })
                    }
                >
                    Get
                </button>
            </div>

            {user.org === 'org1' && (
                <div>
                    {/* Request Certification */}
                    <div className="forms-container">
                        <div className="form manufacturer">
                            <div className="upper-form">
                                <h2>Request Halal Certification</h2>
                                <p>
                                    Apply for a request for halal certification.
                                </p>
                            </div>
                            <input
                                type="text"
                                placeholder="Product ID"
                                value={productID}
                                onChange={(e) => setProductID(e.target.value)}
                            />
                            <button
                                className="submit-button"
                                onClick={() =>
                                    handleSubmit('requestHalalCertification', {
                                        productID,
                                    })
                                }
                            >
                                Request Certification
                            </button>
                        </div>

                        {/* Submit Ingredients List */}
                        <div className="form manufacturer">
                            <div className="upper-form">
                                <h2>Submit Ingredients List</h2>
                                <p>
                                    Attach the ingredients list relevant to the
                                    product ID provided.<br></br>Note: The list
                                    provided must be for a prior, valid product
                                    requested for certification.
                                </p>
                            </div>
                            <input
                                className="submit-button"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (productID && file) {
                                        setUploadedFiles((prev) => ({
                                            ...prev,
                                            [productID]: {
                                                file,
                                                type: 'ingredients',
                                            },
                                        }));
                                    }
                                    setResponse({
                                        message: 'File submitted successfully.',
                                        time: new Date()
                                            .toLocaleString('sv-SE', {
                                                timeZone: 'Asia/Dubai',
                                            })
                                            .replace(' ', 'T'),
                                    });
                                }}
                            />
                        </div>
                    </div>

                    <div id="submitted">
                        <h1>Submitted Applications</h1>
                        {Object.keys(applicationDetails).length === 0 ? (
                            <p className="nothing-yet">
                                No applications submitted yet.
                            </p>
                        ) : (
                            Object.values(applicationDetails).map((app) => (
                                <div key={app.id} className="submitted-app">
                                    <h4>Application ID: {app.id}</h4>
                                    <p>
                                        ID: {app.details.ID}
                                        <br></br>Client: {app.details.Client}
                                        <br></br>Status: {app.details.Status}
                                        <br></br>Request Date:{' '}
                                        {app.details.RequestDate}
                                        <br></br>Ingredients CID:{' '}
                                        {app.details.IngredientsCID
                                            ? app.details.IngredientsCID
                                            : 'null'}
                                        <br></br>Certificate CID:{' '}
                                        {app.details.CertificateCID
                                            ? app.details.CertificateCID
                                            : 'null'}
                                        <br></br>Certification Date:{' '}
                                        {app.details.CertificationDate
                                            ? app.details.CertificationDate
                                            : 'null'}
                                        <br></br>Appeal Reason:{' '}
                                        {app.details.AppealReason
                                            ? app.details.AppealReason
                                            : 'null'}
                                    </p>
                                    {app.details.Status === 'requested' ||
                                        (app.details.Status === 'pending' && (
                                            <button
                                                id="cancel-button"
                                                className="submit-button red-button"
                                                onClick={() =>
                                                    handleSubmit(
                                                        'cancelRequest',
                                                        {
                                                            productID,
                                                        }
                                                    )
                                                }
                                            >
                                                Cancel Request
                                            </button>
                                        ))}
                                    {app.details.Status === 'rejected' && (
                                        <button
                                            className="submit-button"
                                            onClick={() => {
                                                setPopup('appeal-confirm');
                                                setOverlay(true);
                                            }}
                                        >
                                            Appeal
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {uploadedFiles && (
                        <div className="files-received">
                            <h1>Received Files</h1>
                            {Object.keys(uploadedFiles).length === 0 ? (
                                <p className="nothing-yet">
                                    No files submitted yet.
                                </p>
                            ) : (
                                Object.values(applicationDetails).map((app) => {
                                    if (
                                        !uploadedFiles[app.id] ||
                                        uploadedFiles[app.id].type !==
                                            'certificate' ||
                                        !uploadedFiles[app.id].file
                                    ) {
                                        return null;
                                    }
                                    return (
                                        <div key={app.id} className="file">
                                            <h4>Application ID: {app.id}</h4>
                                            <p>
                                                File uploaded:{' '}
                                                <a
                                                    href={URL.createObjectURL(
                                                        uploadedFiles[app.id]
                                                            .file
                                                    )}
                                                    target="_blank"
                                                >
                                                    {
                                                        uploadedFiles[app.id]
                                                            .file.name
                                                    }
                                                </a>
                                            </p>
                                            <iframe
                                                src={URL.createObjectURL(
                                                    uploadedFiles[app.id].file
                                                )}
                                                width="300"
                                                height="200"
                                            ></iframe>
                                            <div className="buttons-container"></div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Appeal Confirm Message */}
                    {popup === 'appeal-confirm' && (
                        <div className="popup">
                            <h3>Please specify the reason for appeal.</h3>
                            <input
                                type="text"
                                placeholder="Appeal Reason"
                                value={appealReason}
                                onChange={(e) =>
                                    setAppealReason(e.target.value)
                                }
                            />
                            {Object.values(applicationDetails).map((app) => (
                                <button
                                    className="submit-button"
                                    onClick={() => {
                                        {
                                            {
                                                handleSubmit('applyForAppeal', {
                                                    productID: app.id,
                                                    appealReason: appealReason,
                                                });
                                                setPopup(null);
                                                setOverlay(false);
                                            }
                                        }
                                    }}
                                >
                                    Confirm Appeal Request
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {user.org === 'org2' && (
                <div>
                    <div id="received">
                        <h1>Received Applications</h1>
                        {Object.keys(applicationDetails).length === 0 ? (
                            <p className="nothing-yet">
                                No applications received yet.
                            </p>
                        ) : (
                            Object.values(applicationDetails).map((app) => (
                                <div key={app.id} className="received-app">
                                    <h4>Application ID: {app.id}</h4>
                                    <p>
                                        ID: {app.details.ID}
                                        <br></br>Client: {app.details.Client}
                                        <br></br>Status: {app.details.Status}
                                        <br></br>Request Date:{' '}
                                        {app.details.RequestDate}
                                        <br></br>Ingredients CID:{' '}
                                        {app.details.IngredientsCID
                                            ? app.details.IngredientsCID
                                            : 'null'}
                                        <br></br>Certificate CID:{' '}
                                        {app.details.CertificateCID
                                            ? app.details.CertificateCID
                                            : 'null'}
                                        <br></br>Certification Date:{' '}
                                        {app.details.CertificationDate
                                            ? app.details.CertificationDate
                                            : 'null'}
                                        <br></br>Appeal Reason:{' '}
                                        {app.details.AppealReason
                                            ? app.details.AppealReason
                                            : 'null'}
                                    </p>
                                    <div className="buttons-container">
                                        {app.details.Status === 'pending' && (
                                            <div>
                                                <button
                                                    className="submit-button"
                                                    onClick={() => {
                                                        setPopup(
                                                            'certificate-grant'
                                                        );
                                                        setOverlay(true);
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    id="reject-button"
                                                    className="submit-button red-button"
                                                    onClick={() =>
                                                        handleSubmit(
                                                            'rejectHalalCertification',
                                                            {
                                                                productID:
                                                                    app.details
                                                                        .ID,
                                                            }
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {app.details.Status === 'appealed' && (
                                            <div>
                                                <button
                                                    className="submit-button"
                                                    onClick={() => {
                                                        setPopup(
                                                            'check-appeal'
                                                        );
                                                        setOverlay(true);
                                                    }}
                                                >
                                                    Check Appeal
                                                </button>
                                            </div>
                                        )}
                                        {app.details.Status ===
                                            'appeal-accepted' && (
                                            <div>
                                                <button
                                                    className="submit-button"
                                                    onClick={() => {
                                                        setPopup(
                                                            'certificate-grant-after-appeal'
                                                        );
                                                        setOverlay(true);
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="submit-button red-button"
                                                    onClick={() => {
                                                        handleSubmit(
                                                            'rejectAfterAppeal',
                                                            {
                                                                productID:
                                                                    app.id,
                                                            }
                                                        );
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {uploadedFiles && (
                        <div className="files-received">
                            <h1>Received Files</h1>
                            {Object.keys(uploadedFiles).length === 0 ? (
                                <p className="nothing-yet">
                                    No files received yet.
                                </p>
                            ) : (
                                Object.values(applicationDetails).map((app) => {
                                    if (
                                        !uploadedFiles[app.id] ||
                                        uploadedFiles[app.id].type !==
                                            'ingredients' ||
                                        !uploadedFiles[app.id].file
                                    ) {
                                        return null;
                                    }
                                    return (
                                        <div key={app.id} className="file">
                                            <h4>Application ID: {app.id}</h4>
                                            <p>
                                                File uploaded:{' '}
                                                <a
                                                    href={URL.createObjectURL(
                                                        uploadedFiles[app.id]
                                                            .file
                                                    )}
                                                    target="_blank"
                                                >
                                                    {
                                                        uploadedFiles[app.id]
                                                            .file.name
                                                    }
                                                </a>
                                            </p>
                                            <iframe
                                                src={URL.createObjectURL(
                                                    uploadedFiles[app.id].file
                                                )}
                                                width="300"
                                                height="200"
                                            ></iframe>
                                            <div className="buttons-container">
                                                <button
                                                    className="submit-button"
                                                    onClick={() =>
                                                        handleUploadToIPFS(
                                                            'uploadFile',
                                                            app.id,
                                                            'ingredients'
                                                        )
                                                    }
                                                >
                                                    Upload to IPFS
                                                </button>
                                                <button
                                                    className="submit-button"
                                                    onClick={() => {
                                                        handleSubmit(
                                                            'checkCompliance',
                                                            {
                                                                productID:
                                                                    app.details
                                                                        .ID,
                                                            }
                                                        );
                                                        handleReadFile(
                                                            uploadedFiles[
                                                                app.id
                                                            ].file
                                                        );
                                                    }}
                                                >
                                                    Check Compliance
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Certificate Grant Message */}
                    {popup === 'certificate-grant' && (
                        <div className="popup">
                            <h3>Select the certificate file to grant.</h3>
                            <input
                                className="submit-button"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    {
                                        const file = e.target.files[0];
                                        if (productID && file) {
                                            setUploadedFiles((prev) => ({
                                                ...prev,
                                                [productID]: {
                                                    file,
                                                    type: 'certificate',
                                                },
                                            }));
                                        }
                                        setPopup('certificate-upload');
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Certificate Upload Message */}
                    {popup === 'certificate-upload' && (
                        <div className="popup">
                            <h3>
                                File chosen.<br></br>Upload to IPFS and finalize
                                approval.
                            </h3>
                            {Object.values(applicationDetails).map((app) => (
                                <button
                                    className="submit-button"
                                    onClick={() => {
                                        {
                                            handleUploadToIPFS(
                                                'uploadFile',
                                                app.id,
                                                'certificate'
                                            );
                                            setPopup(null);
                                            setOverlay(false);
                                        }
                                    }}
                                >
                                    Upload to IPFS and Approve
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Check Appeal Message */}
                    {popup === 'check-appeal' && (
                        <div className="popup">
                            {Object.values(applicationDetails).map((app) => (
                                <div>
                                    <h4>Appeal Details</h4>
                                    <p>
                                        ID: {app.details.ID}
                                        <br></br>Status: {app.details.Status}
                                        <br></br>Appeal Reason:{' '}
                                        {app.details.AppealReason
                                            ? app.details.AppealReason
                                            : 'null'}
                                    </p>
                                    <button
                                        className="submit-button"
                                        onClick={() => {
                                            {
                                                {
                                                    handleSubmit(
                                                        'decideOnAppeal',
                                                        {
                                                            productID: app.id,
                                                            decision:
                                                                'appeal-accepted',
                                                        }
                                                    );
                                                    setPopup(null);
                                                    setOverlay(false);
                                                }
                                            }
                                        }}
                                    >
                                        Accept Appeal
                                    </button>
                                    <button
                                        className="submit-button red-button"
                                        onClick={() => {
                                            {
                                                {
                                                    handleSubmit(
                                                        'decideOnAppeal',
                                                        {
                                                            productID: app.id,
                                                            decision:
                                                                'appeal-rejected',
                                                        }
                                                    );
                                                    setPopup(null);
                                                    setOverlay(false);
                                                }
                                            }
                                        }}
                                    >
                                        Reject Appeal
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Certificate Grant After Appeal Message */}
                    {popup === 'certificate-grant-after-appeal' && (
                        <div className="popup">
                            <h3>Select the certificate file to grant.</h3>
                            <input
                                className="submit-button"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    {
                                        const file = e.target.files[0];
                                        if (productID && file) {
                                            setUploadedFiles((prev) => ({
                                                ...prev,
                                                [productID]: {
                                                    file,
                                                    type: 'certificate',
                                                },
                                            }));
                                        }
                                        setPopup(
                                            'certificate-upload-after-appeal'
                                        );
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Certificate Upload Message */}
                    {popup === 'certificate-upload-after-appeal' && (
                        <div className="popup">
                            <h3>
                                File chosen.<br></br>Upload to IPFS and finalize
                                approval.
                            </h3>
                            {Object.values(applicationDetails).map((app) => (
                                <button
                                    className="submit-button"
                                    onClick={() => {
                                        {
                                            handleUploadToIPFS(
                                                'uploadFile',
                                                app.id,
                                                'certificate-after-appeal'
                                            );
                                            setPopup(null);
                                            setOverlay(false);
                                        }
                                    }}
                                >
                                    Upload to IPFS and Approve
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Response */}
            <div className="response">
                <div>{response.message}</div>
                <div>{response.time}</div>
            </div>
            {overlay && <div id="overlay"></div>}
        </div>
    );
}

export default App;
