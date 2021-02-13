import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Link, useHistory } from 'react-router-dom';
import { db } from '../../firebase';
import styled from 'styled-components';
import GlobalStyles from '../GlobalStyles';
import { Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  async function handleLogout() {
    setError('');
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      setError('Failed to log out.');
    }
  }

  useEffect(async () => {
    (async () => {
      const userRef = db.collection('users').doc(currentUser.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log('No user data is available.');
        setUser('N/A');
      } else {
        userDoc.data();
        setUser(userDoc.data());
      }

      let pastWorkouts = [];
      const workoutHistoryRef = db
        .collection('users')
        .doc(currentUser.uid)
        .collection('workoutHistory');

      const historySnapshot = await workoutHistoryRef.get();

      historySnapshot.forEach((doc) => {
        if (!doc.data()) {
          setError('Workout History not available.');
          throw new Error('Workout History not available');
        } else {
          pastWorkouts.push(doc.data());
        }
      });
      setWorkoutHistory(pastWorkouts);
    })();
  }, []);

  return (
    <div>
      {user ? (
        <Container>
          <GradientContainer>
            <GlobalStyles />
            <ColumnContainer>
              <UserDataContainer>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ProfilePicture
                    src={
                      user.imageUrl ||
                      `https://robohash.org/${user.username}.png`
                    }
                  />
                  <UserName>{user.username}</UserName>

                  <Link to="/exercise-form" className="link-reset hover-reset">
                    <StyledButton
                      style={{
                        backgroundColor: '#6BE19B',
                        padding: '1rem',
                      }}
                    >
                      Start Workout
                    </StyledButton>
                  </Link>
                </div>
                <UserInfo>
                  <Flex style={{ width: '90%' }}>
                    <DataBox>
                      <div>
                        <Title>Active Streak:</Title>
                      </div>
                      <div>
                        <AcheivementText>
                          {user.activeStreak || 0}
                        </AcheivementText>
                      </div>
                    </DataBox>
                    <DataBox>
                      <div>
                        <Title>Lifetime Reps:</Title>
                      </div>
                      <div>
                        <AcheivementText>
                          Squats: {user.lifetimeReps || 0}
                        </AcheivementText>
                      </div>
                    </DataBox>
                    <DataBox>
                      <div>
                        <Title>Lifetime Sets:</Title>
                      </div>
                      <div>
                        <AcheivementText>
                          {user.lifetimeSets || 'n/a'}
                        </AcheivementText>
                      </div>
                    </DataBox>
                    <DataBox>
                      <div>
                        <Title>Latest Activity:</Title>
                      </div>
                      <div>
                        <AcheivementText>
                          {workoutHistory.length &&
                            workoutHistory[workoutHistory.length - 1].date
                              .toDate()
                              .toString()
                              .slice(
                                0,
                                workoutHistory[workoutHistory.length - 1].date
                                  .toDate()
                                  .toString()
                                  .indexOf(':') - 3
                              )}
                        </AcheivementText>
                      </div>
                    </DataBox>
                  </Flex>
                </UserInfo>
              </UserDataContainer>
              <AnalyticsContainer
                style={{ marginTop: '2rem', justifyContent: 'flex-start' }}
              >
                <CustomWorkoutTitle
                  style={{
                    paddingLeft: '1rem',
                    marginLeft: '1rem',
                  }}
                >
                  Most Recent Sets
                </CustomWorkoutTitle>
              </AnalyticsContainer>
              <WorkoutContainer>
                <Workouts>
                  {workoutHistory.length ? (
                    workoutHistory
                      .slice(Math.max(0, workoutHistory.length - 3))
                      .reverse()
                      .map((ele, i) => {
                        return (
                          <WorkoutBox key={i}>
                            <CustomWorkoutTitle>
                              {ele.workout.type[0].toUpperCase() +
                                ele.workout.type.slice(1)}
                            </CustomWorkoutTitle>
                            <CustomWorkoutType className="lighter">
                              {ele.date
                                .toDate()
                                .toString()
                                .slice(
                                  0,
                                  ele.date.toDate().toString().indexOf(':') - 8
                                )}
                            </CustomWorkoutType>
                            <CustomWorkoutDetail id="wText">
                              <Title>Reps: </Title>
                              <Text>{ele.workout.reps}</Text>
                            </CustomWorkoutDetail>
                            <CustomWorkoutDetail>
                              <Title>Sets: </Title>
                              <Text>{ele.workout.sets}</Text>
                            </CustomWorkoutDetail>
                            <CustomWorkoutDetail>
                              <Title>Accuracy: </Title>
                              <Text>{ele.workout.accuracy}%</Text>
                            </CustomWorkoutDetail>
                          </WorkoutBox>
                        );
                      })
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: 'auto',
                        flexDirection: 'column',
                      }}
                    >
                      <NoWorkouts>No workout history</NoWorkouts>
                      <Link
                        to="/exercise-form"
                        className="link-reset hover-reset"
                      >
                        <StyledButton
                          style={{
                            backgroundColor: '#6BE19B',
                            padding: '1rem',
                          }}
                        >
                          Get Started <FontAwesomeIcon icon={faArrowRight} />
                        </StyledButton>
                      </Link>
                    </div>
                  )}
                </Workouts>
              </WorkoutContainer>
            </ColumnContainer>
            <AccountSettingsContainer>
              {/* <CurrentSettings>
                <h2 style={{ color: 'white' }}>Account Settings</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Row>
                  <Title>Email: </Title>
                  <Text> {currentUser.email}</Text>
                </Row>
                <Row>
                  <Title>Username: </Title>
                  <Text>{user.username || 'n/a'}</Text>
                </Row>
                <Row>
                  <Title>Age: </Title>
                  <Text>{user.age || 'n/a'}</Text>
                </Row>
                <Row>
                  <Title>Height: </Title>
                  <Text>{user.height || 'n/a'}</Text>
                </Row>
                <Row>
                  <Title>Weight: </Title>
                  <Text>{user.weight || 'n/a'}</Text>
                </Row>
                <Row>
                  <Title>Sex:{'  '}</Title>
                  <Text>{user.sex || 'n/a'}</Text>
                </Row>
              </CurrentSettings>
              <Link to="/update-profile" className="link-reset hover-reset">
                <StyledButton>Update Account Info</StyledButton>
              </Link>
              <Link to="/user-profile-form" className="link-reset hover-reset">
                <StyledButton>Update User Profile</StyledButton>
              </Link> */}
              <div>
                <StyledButton
                  style={{ backgroundColor: '#FD374C' }}
                  onClick={handleLogout}
                >
                  Log Out
                </StyledButton>
                <div style={{ color: 'white' }}>Copyright ©2021 DSLD</div>
              </div>
            </AccountSettingsContainer>
          </GradientContainer>
        </Container>
      ) : (
        ''
      )}
    </div>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const GradientContainer = styled.div`
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

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.5rem;
  margin-top: 65px;
`;

const UserDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 1rem;
  @media only screen and (min-width: 960px) {
    height: 35vh;
    flex-direction: row;
    justify-content: space-evenly;
    padding: 0 1.5rem;
    margin-top: 2rem;
  }
`;

const ProfilePicture = styled.img`
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  border: 3px;
  border: 5px solid #f8b195;
  position: relative;
  overflow: hidden;
  @media only screen and (min-width: 960px) {
    width: 12rem;
    height: 12rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #355c7d;
  border-radius: 2rem;
  color: white;
  justify-content: center;
  align-items: center;
  @media only screen and (min-width: 960px) {
    flex-direction: row;
    margin-left: 2rem;
  }
`;

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  @media only screen and (min-width: 960px) {
    flex-direction: row;
    height: 100%;
    width: 70%;
  }
`;

const AnalyticsContainer = styled.div`
  display: none;
  @media only screen and (min-width: 960px) {
    display: flex;
    height: 10vh;
    width: 100%;
    border-radius: 5px;
    justify-content: center;
    align-items: center;
  }
`;

const WorkoutContainer = styled.div`
  width: 100%;
  padding: 1rem;
`;

const Workouts = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* height: 50rem; */
  @media only screen and (min-width: 960px) {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    height: 20rem;
    flex-direction: row;
  }
`;

const WorkoutBox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0 0 1rem 0;
  background-color: #355c7d;
  border-radius: 2rem;
  align-items: center;
  justify-content: center;
  @media only screen and (min-width: 960px) {
    margin: 0 1rem;
  }
`;

const CustomWorkoutTitle = styled.h1`
  font-family: 'Inter';
  color: #355c7d;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 1rem;
`;
const CustomWorkoutType = styled.p`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
`;
const CustomWorkoutDetail = styled.h3`
  display: flex;
  align-items: center;
  color: white;
  font-size: 1rem;
`;

const StyledButton = styled.button`
  background-color: #f67280;
  color: white;
  padding: 1rem;
  border-radius: 0.8rem;
  border-style: none;
  margin-bottom: 1rem;
  width: 100%;
  @media only screen and (min-width: 960px) {
    width: 10rem;
  }
`;

const AccountSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  justify-content: center;
  background-color: #f9a26c;
  margin-top: 3rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
`;

const CurrentSettings = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const Title = styled.p`
  font-family: 'Josefin Sans';
  color: white;
  font-size: 1.7rem;
  padding-right: 0.5rem;
`;

const AcheivementText = styled.h3`
  color: white;
  font-size: 1.4rem;
`;

const Text = styled.p`
  color: white;
  font-size: 1rem;
  font-weight: 300;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const DataBox = styled.div`
  flex: 1;
  width: 100%;
  padding: 1rem 0;
  justify-content: center;

  @media only screen and (min-width: 960px) {
    border: 7px solid #6be19b;
    height: 90%;
    border-radius: 50%;
    margin: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
`;

const UserName = styled.h1`
  font-family: 'Josefin Sans';
  font-size: 2rem;
  color: whitesmoke;
`;

const NoWorkouts = styled.h1`
  color: rgb(0, 0, 0, 0.04);
  font-size: 1.8rem;
  @media only screen and (min-width: 960px) {
    font-size: 5rem;
  }

  @media only screen and (min-width: 1110px) {
    font-size: 7rem;
  }
`;

const StatCircles = styled.div`
  border: '5px solid #FFD700';
  height: '90%';
  border-radius: '50%';
  margin: '1rem';
  padding: '1rem';
  display: 'flex';
  align-items: 'center';
  flex-direction: 'column';
`;
