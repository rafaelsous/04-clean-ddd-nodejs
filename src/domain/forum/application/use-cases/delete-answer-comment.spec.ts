import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryAnswerCommentsRepository } from 'test/repositories/in-memory/in-memory-answer-comments-repository'
import { DeleteAnswerCommentUseCase } from './delete-answer-comment'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { makeAnswerComment } from 'test/factories/make-answer-comment'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let answerCommentsRepository: InMemoryAnswerCommentsRepository
let sut: DeleteAnswerCommentUseCase // system under test

describe('Delete Answer Comment Use Case', () => {
  beforeEach(() => {
    answerCommentsRepository = new InMemoryAnswerCommentsRepository()
    sut = new DeleteAnswerCommentUseCase(answerCommentsRepository)
  })

  it('should be able to delete a answer comment successfully', async () => {
    const answerComment = makeAnswerComment(
      {
        authorId: new UniqueEntityID('author-01'),
        answerId: new UniqueEntityID('answer-01'),
        content: 'Answer Comment Content',
      },
      new UniqueEntityID('answer-comment-id'),
    )

    await answerCommentsRepository.create(answerComment)

    const result = await sut.execute({
      authorId: answerComment.authorId.toString(),
      answerCommentId: answerComment.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({})
  })

  it('should not be able to delete a answer comment when it not exists', async () => {
    const result = await sut.execute({
      authorId: 'author-01',
      answerCommentId: 'not-existent-answer-comment-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to delete a answer comment from another author', async () => {
    const answerComment = makeAnswerComment(
      {
        authorId: new UniqueEntityID('author-01'),
      },
      new UniqueEntityID('answer-comment-01'),
    )

    await answerCommentsRepository.create(answerComment)

    const result = await sut.execute({
      authorId: 'another-author-id',
      answerCommentId: 'answer-comment-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
