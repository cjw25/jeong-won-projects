package com.plandoseediary.service;

import com.plandoseediary.domain.User;
import com.plandoseediary.dto.PasswordChangeForm;
import com.plandoseediary.dto.SignupForm;
import com.plandoseediary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    /*
     * 회원가입
     */
    public void signup(
            SignupForm form
    ) {

        String username =
                form.getUsername().trim();


        if (
                userRepository
                        .existsByUsername(username)
        ) {

            throw new IllegalArgumentException(
                    "이미 사용 중인 아이디입니다."
            );
        }


        if (
                !form.getPassword()
                        .equals(
                                form.getPasswordConfirm()
                        )
        ) {

            throw new IllegalArgumentException(
                    "비밀번호 확인이 일치하지 않습니다."
            );
        }


        User user =
                new User();

        user.setUsername(
                username
        );

        /*
         * 비밀번호 원문은 저장하지 않는다.
         * BCrypt 결과만 DB에 저장한다.
         */
        user.setPasswordHash(
                passwordEncoder.encode(
                        form.getPassword()
                )
        );


        userRepository.save(
                user
        );
    }


    /*
     * 비밀번호 변경
     */
    public void changePassword(
            String username,
            PasswordChangeForm form
    ) {

        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "로그인 사용자를 찾을 수 없습니다."
                                )
                        );


        /*
         * 입력된 현재 비밀번호와
         * DB의 BCrypt 값 비교.
         */
        if (
                !passwordEncoder.matches(
                        form.getCurrentPassword(),
                        user.getPasswordHash()
                )
        ) {

            throw new IllegalArgumentException(
                    "현재 비밀번호가 올바르지 않습니다."
            );
        }


        if (
                !form.getNewPassword()
                        .equals(
                                form.getNewPasswordConfirm()
                        )
        ) {

            throw new IllegalArgumentException(
                    "새 비밀번호 확인이 일치하지 않습니다."
            );
        }


        /*
         * 이전 비밀번호와 같은 비밀번호는
         * 변경으로 인정하지 않는다.
         */
        if (
                passwordEncoder.matches(
                        form.getNewPassword(),
                        user.getPasswordHash()
                )
        ) {

            throw new IllegalArgumentException(
                    "새 비밀번호는 현재 비밀번호와 다르게 입력해주세요."
            );
        }


        /*
         * 새로운 BCrypt 값으로 교체.
         * 새 비밀번호 원문은 저장하지 않는다.
         */
        user.setPasswordHash(
                passwordEncoder.encode(
                        form.getNewPassword()
                )
        );


        userRepository.save(
                user
        );
    }
}