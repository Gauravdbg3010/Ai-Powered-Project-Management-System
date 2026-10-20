package com.taskflow.user;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    public List<User> findAllEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.EMPLOYEE)
                .toList();
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User updateRole(Long id, User.Role role) {
        User user = findById(id);
        user.setRole(role);
        return userRepository.save(user);
    }
}
