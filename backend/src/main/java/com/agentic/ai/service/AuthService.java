package com.agentic.ai.service;

import com.agentic.ai.dto.AuthDTO;
import com.agentic.ai.entity.Role;
import com.agentic.ai.entity.User;
import com.agentic.ai.exception.AppSecurityException;
import com.agentic.ai.repository.UserRepository;
import com.agentic.ai.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppSecurityException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppSecurityException("Email '" + request.getEmail() + "' is already registered.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName() != null ? request.getFullName() : request.getUsername())
                .role(Role.ROLE_USER)
                .build();

        user = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUsername(user.getUsername());

        return AuthDTO.AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new AppSecurityException("User not found"));

        return AuthDTO.AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Return or create a default demo user for frictionless exploration
            return userRepository.findByUsername("guest_analyst")
                    .orElseGet(() -> userRepository.save(User.builder()
                            .username("guest_analyst")
                            .email("analyst@example.com")
                            .passwordHash(passwordEncoder.encode("guest12345"))
                            .fullName("Guest Data Analyst")
                            .role(Role.ROLE_USER)
                            .build()));
        }

        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppSecurityException("Current authenticated user not found"));
    }
}
