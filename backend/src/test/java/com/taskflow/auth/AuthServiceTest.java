package com.taskflow.auth;

import com.taskflow.auth.dto.AuthResponse;
import com.taskflow.auth.dto.LoginRequest;
import com.taskflow.auth.dto.RegisterRequest;
import com.taskflow.security.JwtUtil;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .name("Sarah Connor")
                .email("sarah@taskflow.com")
                .passwordHash("hashed_password")
                .role(User.Role.EMPLOYEE)
                .build();
        sampleUser.setId(10L);
    }

    @Test
    void register_ShouldEnforceEmployeeRole_AndReturnToken() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Sarah Connor");
        req.setEmail("sarah@taskflow.com");
        req.setPassword("Password123!");

        when(userRepository.existsByEmail("sarah@taskflow.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString(), anyLong())).thenReturn("mock_jwt_token");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("sarah@taskflow.com", resp.getEmail());
        assertEquals("EMPLOYEE", resp.getRole()); // Registration never grants MANAGER role
        assertEquals("mock_jwt_token", resp.getToken());
        verify(userRepository).save(argThat(u -> u.getRole() == User.Role.EMPLOYEE));
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyRegistered() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("sarah@taskflow.com");

        when(userRepository.existsByEmail("sarah@taskflow.com")).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_ShouldReturnToken_WhenCredentialsValid() {
        LoginRequest req = new LoginRequest();
        req.setEmail("sarah@taskflow.com");
        req.setPassword("Password123!");

        when(userRepository.findByEmail("sarah@taskflow.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password123!", "hashed_password")).thenReturn(true);
        when(jwtUtil.generateToken("sarah@taskflow.com", "EMPLOYEE", 10L)).thenReturn("mock_jwt_token");

        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertEquals("mock_jwt_token", resp.getToken());
        assertEquals("Sarah Connor", resp.getName());
    }

    @Test
    void login_ShouldThrowBadCredentials_WhenPasswordInvalid() {
        LoginRequest req = new LoginRequest();
        req.setEmail("sarah@taskflow.com");
        req.setPassword("WrongPassword");

        when(userRepository.findByEmail("sarah@taskflow.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_password")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(req));
    }
}
