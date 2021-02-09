import React, { useRef, useState } from 'react';
import { Button, Card, Form, Alert } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';
import app from '../../firebase';

const GradientContainer = styled.div`
  /* display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%; */

  &:after {
    background: rgb(242, 102, 39);
    background: linear-gradient(
      -190deg,
      rgba(242, 102, 39, 1) 0%,
      rgba(255, 255, 255, 1) 75%,
      rgba(255, 255, 255, 1) 100%
    );
    content: ' ';
    display: block;
    position: absolute;
    top: -20px;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 65px;
  z-index: 1;
`;

export default function UserProfileForm() {
  const usernameRef = useRef();
  const heightRef = useRef();
  const weightRef = useRef();
  const ageRef = useRef();
  const sexRef = useRef();

  const [error, setError] = useState('');
  // using this state to disable the signup button to keep the user from creating multiple accounts at the same time
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      // set error to an empty string so we have no error
      setError('');
      setLoading(true);

      let userRef = app.firestore().collection('users');
      let userName = userRef.where('username', '==', usernameRef.current.value);

      console.log(userName);

      // ensures username is not taken
      if (userName !== null) {
        return setError('Username not available');
      }

      app
        .firestore()
        .collection('users')
        .doc(app.auth().currentUser.uid)
        .set({
          username: usernameRef.current.value,
          age: ageRef.current.value,
          height: heightRef.current.value,
          weight: weightRef.current.value,
          sex: sexRef.current.value,
        })
        .catch((error) => {
          console.log(
            'Something went wrong with adding user data to firestore: ',
            error
          );
        });
      history.push('/dashboard');
    } catch (error) {
      console.log(error);
      setError('Failed to update user profile');
    }
    setLoading(false);
  }

  return (
    <>
      <GradientContainer>
        <ContentContainer>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">User Profile</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="username">
                  <Form.Label>Username:</Form.Label>
                  <Form.Control type="string" ref={usernameRef} />
                </Form.Group>
                <Form.Group id="age">
                  <Form.Label>Age:</Form.Label>
                  <Form.Control type="integer" ref={ageRef} />
                </Form.Group>
                <Form.Group id="height">
                  <Form.Label>Height:</Form.Label>
                  <Form.Control type="integer" ref={heightRef} />
                </Form.Group>
                <Form.Group id="weight">
                  <Form.Label>Weight:</Form.Label>
                  <Form.Control type="integer" ref={weightRef} />
                </Form.Group>
                <Form.Group id="sex">
                  <Form.Label>Sex:</Form.Label>
                  <Form.Control type="integer" ref={sexRef} />
                </Form.Group>
                <Button
                  disable={loading.toString()}
                  type="submit"
                  className="w-100 text-center mt-2"
                >
                  Update
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </ContentContainer>
      </GradientContainer>
    </>
  );
}
