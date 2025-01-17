// src/components/StaffManagementPage.js

import React, { useState, useEffect } from 'react';
import { 
    getRestaurantProfile, 
    addStaff, 
    removeStaff, 
    createUser 
} from '../services/api';  // Ensure correct path
import { useParams } from 'react-router-dom';
import { 
    Container, 
    Row, 
    Col, 
    Table, 
    Button, 
    Card,
    Modal, 
    Form, 
    Spinner, 
    Alert 
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FaTrash, FaPlus, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const StaffManagementPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId } = useParams();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState([{ username: '', password: '' }]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await getRestaurantProfile(restaurantId);
            setStaff(response.data.staff);  // Assuming 'staff' is an array of user objects
            setError(null);
        } catch (err) {
            setError(t('errors.fetchStaff'));
            toast.error(t('errors.fetchStaff'));
        } finally {
            setLoading(false);
        }
    };

    // Handle Add Staff Modal
    const handleShowAddModal = () => setShowAddModal(true);
    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setFormData([{ username: '', password: '' }]);
        setError(null);
    };

    // Handle Form Changes for Add
    const handleAddChange = (index, e) => {
        const { name, value } = e.target;
        const newFormData = [...formData];
        newFormData[index][name] = value;
        setFormData(newFormData);
    };

    // Add another staff member form
    const addStaffMember = () => {
        setFormData([...formData, { username: '', password: '' }]);
    };

    // Remove a staff member form
    const removeStaffMemberForm = (index) => {
        const newFormData = [...formData];
        newFormData.splice(index, 1);
        setFormData(newFormData);
    };

    // Handle Add Staff Submission
    const handleAddStaff = async (e) => {
        e.preventDefault();

        // Validate all forms
        for (let i = 0; i < formData.length; i++) {
            const { username, password } = formData[i];
            if (!username || !password) {
                toast.error(t('errors.fillRequiredFields'));
                return;
            }
            if (password.length < 8) {
                toast.error(t('errors.passwordTooShort'));
                return;
            }
        }

        try {
            setLoading(true);
            const usernames = [];

            // Create users
            for (let i = 0; i < formData.length; i++) {
                const { username, password } = formData[i];
                await createUser({ username, password, email: `${username}@example.com` }); // Adjust email as needed
                usernames.push(username);
            }

            // Assign to staff
            await addStaff(restaurantId, usernames);

            toast.success(t('success.staffAdded'));
            handleCloseAddModal();
            fetchStaff();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.error || t('errors.addStaffFailed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete Staff with Confirmation
    const handleDeleteStaff = (username) => {
        if (window.confirm(t('confirm.removeStaff'))) {
            deleteStaff(username);
        }
    };

    const deleteStaff = async (username) => {
        try {
            setLoading(true);
            await removeStaff(restaurantId, [username]); // Send as an array
            toast.success(t('success.staffRemoved'));
            fetchStaff();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.error || t('errors.removeStaffFailed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5" dir={i18n.dir()}>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card className="mb-4">
                        <Card.Header as="h5">{t('staffManagement')}</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Button variant="success" onClick={handleShowAddModal} className="mb-3">
                                <FaUserPlus /> {t('addNewStaff')}
                            </Button>

                            {loading && (
                                <div className="text-center my-3">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">{t('loading')}</span>
                                    </Spinner>
                                    <p className="mt-3">{t('loadingStaff')}</p>
                                </div>
                            )}

                            {!loading && staff.length > 0 ? (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{t('username')}</th>
                                            <th>{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map((staffMember, index) => (
                                            <tr key={staffMember.id}>
                                                <td>{index + 1}</td>
                                                <td>{staffMember.username}</td>
                                                <td>
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        onClick={() => handleDeleteStaff(staffMember.username)}
                                                        disabled={loading}
                                                    >
                                                        <FaTrash /> {t('delete')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                !loading && <p className="text-center">{t('noStaff')}</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Staff Modal */}
            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('addNewStaff')}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddStaff}>
                    <Modal.Body>
                        {formData.map((staffMember, index) => (
                            <div key={index} className="mb-3">
                                <Form.Group controlId={`addStaffUsername${index}`} className="mb-2">
                                    <Form.Label>{t('username')} *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="username" 
                                        value={staffMember.username} 
                                        onChange={(e) => handleAddChange(index, e)} 
                                        placeholder={t('enterUsername')} 
                                        required 
                                    />
                                </Form.Group>
                                <Form.Group controlId={`addStaffPassword${index}`} className="mb-2">
                                    <Form.Label>{t('password')} *</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="password" 
                                        value={staffMember.password} 
                                        onChange={(e) => handleAddChange(index, e)} 
                                        placeholder={t('enterPassword')} 
                                        required 
                                    />
                                </Form.Group>
                                {formData.length > 1 && (
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={() => removeStaffMemberForm(index)}
                                        className="mb-3"
                                    >
                                        {t('remove')}
                                    </Button>
                                )}
                                <hr />
                            </div>
                        ))}
                        <Button variant="secondary" onClick={addStaffMember}>
                            {t('addAnotherStaff')}
                        </Button>
                        <Form.Text className="text-muted mt-2 d-block">
                            {t('passwordRequirements')}
                        </Form.Text>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseAddModal}>
                            {t('close')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />{' '}
                                    {t('addingStaff')}
                                </>
                            ) : (
                                <>
                                    <FaPlus /> {t('addStaff')}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );

};

export default StaffManagementPage;
