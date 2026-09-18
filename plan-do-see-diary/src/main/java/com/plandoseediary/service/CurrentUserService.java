package com.plandoseediary.service;

import com.plandoseediary.domain.User;
import com.plandoseediary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal()
        )) {

            throw new IllegalStateException(
                    "로그인이 필요합니다."
            );
        }

        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "로그인 사용자를 찾을 수 없습니다."
                        )
                );
    }

    public String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }
}